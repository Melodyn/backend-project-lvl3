# usage
start: install
setup: dependency install
dependency:
	npm ci
install:
	npm link

# usage with docker
container_setup: container_build container_dependency container_start
container_build:
	docker-compose build
container_start:
	docker-compose run --rm loader /bin/bash
container_dependency:
	docker-compose run --rm loader make dependency

# dev
lint:
	npx eslint .
test:
	npm test -s
test_dev:
	npm test -s -- --watchAll
test_debug_nock:
	DEBUG=nock.* npm test -s
test_debug_axios:
	DEBUG=axios npm test -s

asciinema:
	asciinema rec
publish:
	npm publish --dry-run
container_dev_start:
	docker-compose run --rm loader_dev /bin/bash
