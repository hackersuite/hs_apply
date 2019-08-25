default: build test

# builds the project into the dist folder
build:
	npm run build

# runs test
test:
	npm run test

# builds the docker image
build-docker:
	@echo "=============building hs_hub============="
	docker build -f docker/prod/Dockerfile -t hs_hub .

# builds the docker image for dev environment
build-docker-dev:
	@echo "=============building hs_hub (dev)============="
	docker build -f docker/dev/Dockerfile -t hs_hub .

# sets up the hacker suite docker network
setup-network:
	@echo "=============setting up the hacker suite network============="
	docker network create --driver bridge hacker_suite || echo "This is most likely fine, it just means that the network has already been created"

# starts the app and MySQL in docker containers
up: build-docker setup-network
	@echo "=============starting hs_hub============="
	docker-compose up -d

# starts the app and MySQL in docker containers for dev environment
up-dev: build-docker-dev setup-network
	@echo "=============starting hs_hub (dev)============="
	docker-compose up -d

# prints the logs from all containers
logs:
	docker-compose logs -f

# prints the logs only from the go app
logs-app:
	docker-compose logs -f hs_hub

# prints the logs only from the database
logs-db:
	docker-compose logs -f mysql_db

# shuts down the containers
down:
	docker-compose down

# cleans up unused images, networks and containers
clean: down
	@echo "=============cleaning up============="
	rm -f hs_hub
	docker container prune -f
	docker network prune -f
	docker system prune -f
	docker volume prune -f