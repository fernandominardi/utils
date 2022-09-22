SCRIPT_DIR=$(dirname $0)
DOCKERFILE="${SCRIPT_DIR}/docker-compose.yml"
export TARGET_DIR="${PWD}"
docker compose -f ${DOCKERFILE} run --rm npm "$@"