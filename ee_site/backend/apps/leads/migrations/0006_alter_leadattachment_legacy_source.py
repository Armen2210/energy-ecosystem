import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("leads", "0005_leadattachment_legacy_source_and_sha256")]

    operations = [
        migrations.AlterField(
            model_name="leadattachment",
            name="legacy_source",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="legacy_attachment_copy",
                to="leads.lead",
                verbose_name="Источник в старом поле",
            ),
        ),
    ]
