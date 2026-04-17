from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("app", "0010_produto_cest_produto_cfop_produto_codigo_barras_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="configuracaosistema",
            name="backup_automatico_ativo",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="configuracaosistema",
            name="backup_frequencia_horas",
            field=models.PositiveSmallIntegerField(default=24),
        ),
        migrations.AddField(
            model_name="configuracaosistema",
            name="backup_manter_ultimos",
            field=models.PositiveSmallIntegerField(default=7),
        ),
        migrations.AddField(
            model_name="configuracaosistema",
            name="backup_ultimo_em",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="configuracaosistema",
            name="backup_ultima_mensagem",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="configuracaosistema",
            name="backup_ultimo_status",
            field=models.CharField(
                choices=[
                    ("nunca", "Nunca executado"),
                    ("sucesso", "Sucesso"),
                    ("erro", "Erro"),
                ],
                default="nunca",
                max_length=20,
            ),
        ),
    ]
