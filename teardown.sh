#!/bin/bash
# Este script realiza el teardown de los recursos creados en AWS 

set -e  # Salir inmediatamente si un comando falla

# Cargamos las variables desde .env.teardown - "export" hace que
# queden disponibles como variables de entorno para el resto del
# script, no solo como variables normales de bash.
set -a
source .env.teardown
set +a

echo "=== Iniciando teardown de recursos AWS ==="

# Terminar la instancia EC2
echo "Terminando instancia EC2: $EC2_INSTANCE_ID"
aws ec2 terminate-instances --instance-ids "$EC2_INSTANCE_ID" --region "$AWS_REGION"

#  Eliminar la instancia RDS
echo "Eliminando instancia RDS: $RDS_INSTANCE_ID"
aws rds delete-db-instance \
  --db-instance-identifier "$RDS_INSTANCE_ID" \
  --skip-final-snapshot \
  --region "$AWS_REGION"

# Vaciar y eliminar el bucket S3
echo "Vaciando bucket S3: $S3_BUCKET_NAME"
aws s3 rm "s3://$S3_BUCKET_NAME" --recursive --region "$AWS_REGION"

echo "Eliminando bucket S3: $S3_BUCKET_NAME"
aws s3api delete-bucket --bucket "$S3_BUCKET_NAME" --region "$AWS_REGION"

echo "=== Teardown completado ==="
echo "Nota: la RDS puede tardar varios minutos en terminar de eliminarse."