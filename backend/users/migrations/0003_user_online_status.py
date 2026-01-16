from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_pendingregistration_is_used_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_online',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='last_seen',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
