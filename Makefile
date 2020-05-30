prod_docker_compose_file=./docker-compose.yml
dev_docker_compose_file=./docker/dev/docker-compose.yml
test_docker_compose_file=./docker/test/docker-compose.yml

prod_docker_file=./docker/prod/Dockerfile

NODE_MODULES_DIR = './node_modules'

default: build test

# builds the project into the dist folder
build:
	npm run build

# run all tests
tests:
	docker-compose -f $(test_docker_compose_file) up -d
	while ! docker exec mysql_db_test mysql --user=root -e "SELECT 1" >/dev/null 2>&1; do \
    sleep 10; \
	done
	-npm run test
	docker-compose -f $(test_docker_compose_file) down -v

# builds the docker image
build-docker:
	@echo "=============building hs_application============="
	docker build -f $(prod_docker_file) -t hs_application .

# sets up the hacker suite docker network
setup-network:
	@echo "=============setting up the hacker suite network============="
	docker network create --driver bridge hacker_suite || echo "This is most likely fine, it just means that the network has already been created"

# starts the app and MySQL in docker containers
up: export ENVIRONMENT=production
up: build-docker setup-network
	@echo "=============starting hs_application============="
	docker-compose -f $(prod_docker_compose_file) up -d

# starts the app in local environment and DB in container
up-dev: export ENVIRONMENT=dev
up-dev: export DB_HOST=localhost
up-dev: setup-network
	@echo "=============starting hs_application (dev)============="
	docker-compose -f $(dev_docker_compose_file) up -d
	if [ ! -d $(NODE_MODULES_DIR) ]; then \
		@echo "node_modules does not exist, installing dependencies..."; \
		npm i; \
	else \
			npm run start:watch; \
	fi

ci:
	docker-compose -f $(test_docker_compose_file) up -d
	while ! docker exec mysql_db_test mysql --user=root -e "SELECT 1" >/dev/null 2>&1; do \
    sleep 2; \
	done
	docker exec mysql_db_test mysql --user=root -e "CREATE DATABASE IF NOT EXISTS hs_applications;"
	-npm run test:coverage
	docker-compose -f $(test_docker_compose_file) down -v
	

# prints the logs from all containers
logs:
ifeq ($(ENV), dev)
	docker-compose -f $(dev_docker_compose_file) logs -f
else
	docker-compose -f $(prod_docker_compose_file) logs -f
endif

# prints the logs only from the go app
logs-app:
	docker-compose logs -f hs_application

# prints the logs only from the database
logs-db:
	docker-compose logs -f mysql_db

# shuts down the containers
down:
	docker-compose -f $(prod_docker_compose_file) down
	docker-compose -f $(dev_docker_compose_file) down

# cleans up unused images, networks and containers
clean: down
	@echo "=============cleaning up============="
	rm -f hs_application
	docker container prune -f
	docker network prune -f
	docker system prune -f
	docker volume prune -f