from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0012_configuracaosistema_backup_horarios"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="configuracaosistema",
            name="backup_automatico_ativo",
        ),
        migrations.RemoveField(
            model_name="configuracaosistema",
            name="backup_frequencia_horas",
        ),
        migrations.RemoveField(
            model_name="configuracaosistema",
            name="backup_horarios",
        ),
        migrations.RemoveField(
            model_name="configuracaosistema",
            name="backup_manter_ultimos",
        ),
        migrations.RemoveField(
            model_name="configuracaosistema",
            name="backup_ultimo_em",
        ),
        migrations.RemoveField(
            model_name="configuracaosistema",
            name="backup_ultima_mensagem",
        ),
        migrations.RemoveField(
            model_name="configuracaosistema",
            name="backup_ultimo_status",
        ),
    ]
