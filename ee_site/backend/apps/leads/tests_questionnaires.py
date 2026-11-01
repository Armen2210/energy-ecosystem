import copy
import json
import tempfile
import uuid
from fractions import Fraction
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError
from .models import Lead, LeadQuestionnaire, QuestionnaireJob
from .questionnaires import validate_payload
from .questionnaire_jobs import process_job, _valid
from .lead_creation import create_lead, SubmissionConflict

ROOT = Path(__file__).resolve().parents[4]
EXAMPLE = json.loads(
    (ROOT / "contracts/questionnaires/v1/examples/all-four.json").read_text()
)
PUMPS = json.loads(
    (ROOT / "contracts/questionnaires/v1/examples/pumps.json").read_text()
)


def item(payload, product):
    return next(i for i in payload["items"] if i["product"] == product)


def validated(payload):
    return validate_payload(json.dumps(payload, ensure_ascii=False))


@override_settings(
    QUESTIONNAIRES_ENABLED=True,
    LEAD_RATE_LIMIT_ENABLED=False,
    LEAD_NOTIFICATION_EMAIL="manager@example.invalid",
)
class QuestionnaireTests(TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.override = override_settings(LEAD_PRIVATE_ATTACHMENT_ROOT=self.tmp.name)
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.addCleanup(self.tmp.cleanup)
        self.client = APIClient()

    def create(self, payload=PUMPS, **extra):
        return create_lead(
            {
                "name": "Синтетическая проверка",
                "phone": "+70000000000",
                "submission_id": uuid.uuid4(),
                "questionnaires": validated(payload),
                **extra,
            }
        )[0]

    def test_all_four_maximum_schema_and_pdf_email(self):
        lead = self.create(EXAMPLE)
        self.assertEqual(lead.questionnaires.count(), 4)
        self.assertEqual(process_job(lead.pk), "done")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(len(mail.outbox[0].attachments), 4)
        self.assertLess(
            len(mail.outbox[0].message().as_bytes()),
            settings.LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE,
        )
        for q in lead.questionnaires.all():
            self.assertTrue(_valid(q))
            with q.file.open("rb") as pdf:
                self.assertTrue(pdf.read().startswith(b"%PDF-"))
        self.assertEqual(process_job(lead.pk), "skipped")
        self.assertEqual(len(mail.outbox), 1)

    def test_invalid_hidden_and_unknown_payloads(self):
        for mutate in [
            lambda p: item(p, "pns")["answers"]["technical"].pop("jockey_flow"),
            lambda p: item(p, "vns")["answers"]["technical"].update(flow="NaN"),
            lambda p: item(p, "vns")["answers"]["technical"].update(unknown="x"),
            lambda p: p["items"].append(p["items"][0]),
            lambda p: p.update(version=True),
            lambda p: item(p, "vns").update(schemaVersion=2),
            lambda p: item(p, "pns")["answers"]["technical"].update(jockey="Нет"),
            lambda p: item(p, "vns")["answers"]["technical"].update(reserve_count="-1"),
        ]:
            p = copy.deepcopy(PUMPS)
            mutate(p)
            with self.assertRaises(ValidationError):
                validated(p)
        self.assertEqual(Lead.objects.count(), 0)

    def test_bmk_useful_load_gas_and_gvs(self):
        for mutate in [
            lambda a: a.update(loads={"losses": {"value": "10", "unit": "кВт"}}),
            lambda a: a["loads"].pop("dhw_average"),
            lambda a: a["fuel"].pop("gas_pressure"),
            lambda a: a["ov"].pop("return_pressure"),
            lambda a: a["scheme"].pop("staff"),
        ]:
            p = copy.deepcopy(EXAMPLE)
            mutate(item(p, "bmk")["answers"])
            with self.assertRaises(ValidationError):
                validated(p)

    def test_btp_collector_only_and_limits(self):
        p = copy.deepcopy(EXAMPLE)
        i = item(p, "btp")
        i["answers"] = {
            k: v
            for k, v in i["answers"].items()
            if k in ("common", "collector_heating")
        }
        i["answers"]["selectedSections"] = ["collector_heating"]
        self.assertTrue(validated(p))
        i["answers"]["collector_heating"]["outlets"].append({"id": "101", "flow": "1"})
        with self.assertRaises(ValidationError):
            validated(p)
        i["answers"]["collector_heating"]["outlets"] = [
            {"id": "empty", "balance_supply": "Нет"}
        ]
        with self.assertRaises(ValidationError):
            validated(p)

    def test_btp_conditional_reserve_percent(self):
        for percentage in ("49", "50", "70", "100", "101"):
            p = copy.deepcopy(EXAMPLE)
            a = item(p, "btp")["answers"]["heating"]
            a["connection"] = "Независимое"
            a["reserve_to"] = "Да"
            a["reserve_percent"] = percentage
            if percentage in ("49", "101"):
                with self.assertRaises(ValidationError):
                    validated(p)
            else:
                self.assertTrue(validated(p))

    def test_idempotency_sort_and_changed_hidden(self):
        data = {
            "name": "Test",
            "phone": "000",
            "submission_id": uuid.uuid4(),
            "questionnaires": validated(PUMPS),
        }
        first, created = create_lead(data)
        self.assertTrue(created)
        p = copy.deepcopy(PUMPS)
        p["items"].reverse()
        data["questionnaires"] = validated(p)
        second, created = create_lead(data)
        self.assertFalse(created)
        self.assertEqual(first.pk, second.pk)
        item(p, "pns")["answers"]["technical"]["head"] = "22"
        data["questionnaires"] = validated(p)
        with self.assertRaises(SubmissionConflict):
            create_lead(data)

    def test_api_atomic_errors_and_legacy(self):
        response = self.client.post(
            "/api/leads/",
            {
                "name": "Test",
                "phone": "000",
                "questionnaires": '{"version":1,"items":[]}',
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Lead.objects.count(), 0)
        response = self.client.post(
            "/api/leads/", {"name": "Test", "phone": "000"}, format="multipart"
        )
        self.assertEqual(response.status_code, 201)
        self.assertFalse(QuestionnaireJob.objects.exists())

    def test_generation_failure_and_recovery(self):
        lead = self.create()
        with patch("apps.leads.questionnaire_jobs.subprocess.run", side_effect=OSError):
            self.assertEqual(process_job(lead.pk), "failed")
        self.assertEqual(lead.questionnaires.count(), 2)
        self.assertEqual(len(getattr(mail, "outbox", [])), 0)
        QuestionnaireJob.objects.filter(lead=lead).update(
            next_run=timezone.now() - timedelta(seconds=1)
        )
        self.assertEqual(process_job(lead.pk), "done")

    def test_expired_claim_and_smtp_unknown(self):
        lead = self.create()
        QuestionnaireJob.objects.filter(lead=lead).update(
            status="generating",
            token=uuid.uuid4(),
            lease_until=timezone.now() - timedelta(seconds=1),
        )
        self.assertEqual(process_job(lead.pk), "done")
        lead2 = self.create()
        QuestionnaireJob.objects.filter(lead=lead2).update(
            status="sending",
            token=uuid.uuid4(),
            lease_until=timezone.now() - timedelta(seconds=1),
        )
        self.assertEqual(process_job(lead2.pk), "skipped")
        self.assertEqual(QuestionnaireJob.objects.get(lead=lead2).status, "uncertain")

    def test_storage_private_and_immutable_contact_snapshot(self):
        lead = self.create()
        Lead.objects.filter(pk=lead.pk).update(name="Changed after acceptance")
        q = lead.questionnaires.first()
        self.assertEqual(q.contact_snapshot["name"], "Синтетическая проверка")
        self.assertEqual(process_job(lead.pk), "done")
        q.refresh_from_db()
        with self.assertRaises(ValueError):
            q.file.url
        url = f"/admin/leads/lead/questionnaires/{q.pk}/download/"
        self.assertEqual(self.client.get(url).status_code, 302)
        user = get_user_model().objects.create_superuser(
            username="testadmin", email="admin@example.invalid", password="test-only"
        )
        self.client.force_login(user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("attachment;", response["Content-Disposition"])
        response.close()

    def test_pdf_priority_with_mime_budget_and_user_files(self):
        lead = self.create(attachment=SimpleUploadedFile("large.txt", b"x" * 200000))
        with override_settings(LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE=150000):
            self.assertEqual(process_job(lead.pk), "done")
        self.assertEqual(len(mail.outbox[0].attachments), 2)
        self.assertIn("защищённом Admin", mail.outbox[0].body)
        self.assertEqual(lead.attachments.count(), 1)

    def test_json_limits_duplicates_and_no_coercion(self):
        for raw in [
            '{"version":1,"version":1,"items":[]}',
            "[]",
            "null",
            '{"version":NaN}',
            "[" * 2000,
            "x" * 262145,
        ]:
            with self.assertRaises(ValidationError):
                validate_payload(raw)

    def test_stale_generator_fenced_and_orphan_cleaned(self):
        import subprocess

        lead = self.create()
        run = subprocess.run
        new_token = uuid.uuid4()

        def stale(*args, **kwargs):
            result = run(*args, **kwargs)
            QuestionnaireJob.objects.filter(lead=lead).update(token=new_token)
            return result

        with patch("apps.leads.questionnaire_jobs.subprocess.run", side_effect=stale):
            self.assertEqual(process_job(lead.pk), "lost_claim")
        self.assertEqual(QuestionnaireJob.objects.get(lead=lead).token, new_token)
        self.assertFalse(lead.questionnaires.exclude(file="").exists())
        self.assertEqual(len(getattr(mail, "outbox", [])), 0)

    def test_smtp_exception_is_uncertain_and_not_automatically_retried(self):
        lead = self.create()
        with patch("django.core.mail.message.EmailMessage.send", side_effect=OSError):
            self.assertEqual(process_job(lead.pk), "uncertain")
        self.assertEqual(process_job(lead.pk), "skipped")
        self.assertEqual(QuestionnaireJob.objects.get(lead=lead).status, "uncertain")

    def test_partial_ready_pdf_reused_and_missing_repaired(self):
        lead = self.create()
        self.assertEqual(process_job(lead.pk), "done")
        qs = list(lead.questionnaires.all())
        retained = qs[0].file.name
        qs[1].file.storage.delete(qs[1].file.name)
        QuestionnaireJob.objects.filter(lead=lead).update(status="retry", next_run=None)
        self.assertEqual(process_job(lead.pk), "done")
        qs[0].refresh_from_db()
        self.assertEqual(qs[0].file.name, retained)
        qs[1].refresh_from_db()
        self.assertTrue(_valid(qs[1]))

    def test_exhausted_generation_requires_intervention(self):
        lead = self.create()
        QuestionnaireJob.objects.filter(lead=lead).update(attempts=3)
        self.assertEqual(process_job(lead.pk), "skipped")
        self.assertEqual(QuestionnaireJob.objects.get(lead=lead).status, "intervention")

    def test_canonical_unit_equivalence_and_required_whitespace(self):
        p = copy.deepcopy(EXAMPLE)
        a = item(p, "bmk")["answers"]["loads"]
        a["heating"] = {"value": "1", "unit": "Гкал/ч"}
        one = validated(p)
        a["heating"] = {
            "value": str(Fraction(41868, 10000) * 10**9 / 3600 / 1000),
            "unit": "кВт",
        }
        self.assertEqual(one, validated(p))
        item(p, "btp")["answers"]["common"]["object"] = "  "
        with self.assertRaises(ValidationError):
            validated(p)

    def test_missing_snapshot_never_sends_incomplete_email(self):
        lead = self.create()
        lead.questionnaires.first().delete()
        self.assertEqual(process_job(lead.pk), "failed")
        self.assertEqual(len(getattr(mail, "outbox", [])), 0)
        self.assertEqual(
            QuestionnaireJob.objects.get(lead=lead).expected_products, ["pns", "vns"]
        )

    def test_crash_between_pdfs_reuses_committed_first_document(self):
        import subprocess

        lead = self.create()
        actual_run = subprocess.run
        calls = []

        def fail_second(*args, **kwargs):
            calls.append(1)
            if len(calls) == 2:
                raise OSError("synthetic generation failure")
            return actual_run(*args, **kwargs)

        with patch(
            "apps.leads.questionnaire_jobs.subprocess.run", side_effect=fail_second
        ):
            self.assertEqual(process_job(lead.pk), "failed")
        first = lead.questionnaires.exclude(file="").get()
        retained_name = first.file.name
        self.assertEqual(len(getattr(mail, "outbox", [])), 0)
        QuestionnaireJob.objects.filter(lead=lead).update(next_run=None)
        with patch(
            "apps.leads.questionnaire_jobs.subprocess.run", wraps=actual_run
        ) as render:
            self.assertEqual(process_job(lead.pk), "done")
            self.assertEqual(render.call_count, 1)
        first.refresh_from_db()
        self.assertEqual(first.file.name, retained_name)

    def test_acceptance_rollback_removes_partial_data_and_private_upload(self):
        original = LeadQuestionnaire.objects.create
        calls = []

        def fail_second(**kwargs):
            calls.append(1)
            if len(calls) == 2:
                raise OSError("synthetic transaction failure")
            return original(**kwargs)

        with patch(
            "apps.leads.questionnaire_jobs.LeadQuestionnaire.objects.create",
            side_effect=fail_second,
        ):
            with self.assertRaises(OSError):
                self.create(attachment=SimpleUploadedFile("rollback.txt", b"synthetic"))
        self.assertEqual(Lead.objects.count(), 0)
        self.assertEqual(LeadQuestionnaire.objects.count(), 0)
        self.assertEqual(QuestionnaireJob.objects.count(), 0)
        self.assertFalse(any(Path(self.tmp.name).rglob("*.txt")))
        self.assertEqual(len(getattr(mail, "outbox", [])), 0)

    def test_it_coefficient_uses_independent_nist_calculation_for_new_pdf(self):
        expected = Fraction(41868, 10000) * 10**9 / 3600 / 1000
        self.assertEqual(expected, 1163)
        p = copy.deepcopy(EXAMPLE)
        item(p, "bmk")["answers"]["loads"]["heating"] = {"value": "1", "unit": "Гкал/ч"}
        lead = self.create(p)
        sheet = lead.questionnaires.get(product="bmk")
        self.assertEqual(
            sheet.answers["loads"]["heating"], {"value": str(expected), "unit": "кВт"}
        )
        from .questionnaire_pdf import render_pdf
        from reportlab.platypus import Paragraph

        with patch(
            "apps.leads.questionnaire_pdf.Paragraph",
            wraps=Paragraph,
        ) as paragraph:
            self.assertTrue(render_pdf(sheet).startswith(b"%PDF-"))
        self.assertTrue(
            any(
                "Отопление: 1163 кВт" in str(call.args[0])
                for call in paragraph.call_args_list
            )
        )

    def test_invalid_quantity_types_return_field_addressed_http_400(self):
        path = "bmk.loads.heating"
        for key in ("unit", "value"):
            for value in ([], {}, None, True, False, 0, 1.5):
                with self.subTest(key=key, value=value):
                    p = copy.deepcopy(EXAMPLE)
                    item(p, "bmk")["answers"]["loads"]["heating"][key] = value
                    response = self.client.post(
                        "/api/leads/",
                        {
                            "name": "Synthetic",
                            "phone": "000",
                            "questionnaires": json.dumps(p),
                        },
                        format="multipart",
                    )
                    self.assertEqual(response.status_code, 400)
                    self.assertIn(path, response.json()["questionnaires"])
        for value in ([], {}, None, True, 1.5):
            p = copy.deepcopy(EXAMPLE)
            item(p, "bmk")["answers"]["loads"]["heating"] = value
            response = self.client.post(
                "/api/leads/",
                {"name": "Synthetic", "phone": "000", "questionnaires": json.dumps(p)},
                format="multipart",
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn(path, response.json()["questionnaires"])
        self.assertEqual(Lead.objects.count(), 0)

    def test_js_unit_toggle_reload_preserves_server_canonical_and_fingerprint(self):
        import subprocess
        import shutil

        if not shutil.which("node"):
            self.skipTest("Cross-language contract check requires Node.js")
        script = r"""
import {readFileSync} from 'node:fs';
import {changeUnit,serializeQuestionnaires} from './src/questionnaires/domain.js';
import {saveDraft,readDraft} from './src/api/leadDraftStorage.js';
const fixture=JSON.parse(readFileSync('../../contracts/questionnaires/v1/examples/all-four.json','utf8'));
const drafts=Object.fromEntries(fixture.items.map(i=>[i.product,{enabled:true,answers:i.answers}]));
const regular=drafts.bmk.answers.loads;
const outlet=drafts.btp.answers.collector_heating.outlets[0];
regular.heating={value:'123456789012345.678901234567',unit:'кВт'};
outlet.power={...regular.heating};
drafts.btp.answers.heating.volume={value:'1000.000000000001',unit:'л'};
drafts.bmk.answers.ov.supply_pressure={value:'0.123456789123',unit:'МПа'};
const before=serializeQuestionnaires(drafts);
for(let i=0;i<9;i++){
 regular.heating=changeUnit(regular.heating,i%2?'кВт':'Гкал/ч','power');
 outlet.power=changeUnit(outlet.power,i%2?'кВт':'Гкал/ч','power');
 drafts.btp.answers.heating.volume=changeUnit(drafts.btp.answers.heating.volume,i%2?'л':'м³','volume');
 drafts.bmk.answers.ov.supply_pressure=changeUnit(drafts.bmk.answers.ov.supply_pressure,i%2?'МПа':'кгс/см²','pressure');
}
const after=serializeQuestionnaires(drafts);
const memory=new Map();const storage={setItem:(k,v)=>memory.set(k,v),getItem:k=>memory.get(k)};
saveDraft(storage,{fields:{name:'Test',company_name:'',phone:'000',email:'',description:''},topic:'Test',questionnaires:drafts,changedAt:1000,files:[]},1000);
const recovered=readDraft(storage,1100).questionnaires;
const reloaded=serializeQuestionnaires(recovered);
recovered.bmk.answers.loads.heating={value:'2.5',unit:'Гкал/ч'};
recovered.btp.answers.collector_heating.outlets[0].power={value:'3.5',unit:'Гкал/ч'};
console.log(JSON.stringify({before,after,reloaded,edited:serializeQuestionnaires(recovered)}));
"""
        result = subprocess.run(
            ["node", "--input-type=module", "-e", script],
            cwd=ROOT / "ee_site/frontend",
            capture_output=True,
            text=True,
            check=True,
            timeout=30,
        )
        vectors = json.loads(result.stdout)
        before = validated(vectors["before"])
        self.assertEqual(before, validated(vectors["after"]))
        self.assertEqual(before, validated(vectors["reloaded"]))
        data = {
            "name": "Test",
            "phone": "000",
            "submission_id": uuid.uuid4(),
            "questionnaires": before,
        }
        lead, created = create_lead(data)
        self.assertTrue(created)
        for key in ("after", "reloaded"):
            data["questionnaires"] = validated(vectors[key])
            same, created = create_lead(data)
            self.assertFalse(created)
            self.assertEqual(same.pk, lead.pk)
        edited = validated(vectors["edited"])
        coefficient = Fraction(41868, 10000) * 10**9 / 3600 / 1000
        self.assertEqual(
            item(edited, "bmk")["answers"]["loads"]["heating"]["value"],
            str(float(coefficient * Fraction(5, 2))),
        )
        self.assertEqual(
            item(edited, "btp")["answers"]["collector_heating"]["outlets"][0]["power"][
                "value"
            ],
            str(float(coefficient * Fraction(7, 2))),
        )
        data["questionnaires"] = edited
        with self.assertRaises(SubmissionConflict):
            create_lead(data)
