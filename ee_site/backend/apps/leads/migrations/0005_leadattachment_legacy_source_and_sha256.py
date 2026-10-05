import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("leads", "0004_leadattachment")]

    operations = [
        migrations.AddField(
            model_name="leadattachment",
            name="legacy_source",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="legacy_attachment_copy",
                to="leads.lead",
                verbose_name="Источник в старом поле",
            ),
        ),
        migrations.AddField(
            model_name="leadattachment",
            name="sha256",
            field=models.CharField(
                blank=True,
                editable=False,
                max_length=64,
                verbose_name="SHA-256",
            ),
        ),
    ]
