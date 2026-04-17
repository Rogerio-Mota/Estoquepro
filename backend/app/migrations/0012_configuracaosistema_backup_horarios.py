from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0011_configuracaosistema_backup_campos"),
    ]

    operations = [
        migrations.AddField(
            model_name="configuracaosistema",
            name="backup_horarios",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
