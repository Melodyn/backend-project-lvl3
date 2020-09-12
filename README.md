# Hexlet: "Загрузчик страниц"

[![Github Actions](../../workflows/Node.js%20CI/badge.svg)](../../actions)
[![Test Coverage](https://api.codeclimate.com/v1/badges/90a3516f1a2569997c5b/test_coverage)](https://codeclimate.com/github/Melodyn/backend-project-lvl3/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/90a3516f1a2569997c5b/maintainability)](https://codeclimate.com/github/Melodyn/backend-project-lvl3/maintainability)

Подробнее: https://ru.hexlet.io/projects/4/members/9839

## Требования

* Node.js >= 14
* npm >= 6
* make >= 4

Или:
* Docker >= 19
* Docker compose >= 1.25

## Установка и запуск

Локально:
* `make setup` установка (первый раз)
* `make install` установка утилиты
* `page-loader -h` запуск утилиты (вызов справки)

В контейнере:
* `make container_setup` первый запуск (установка зависимостей) 

* `make container_start` поднять контейнер с приложением
* `make install` установить приложение
* `page-loader -h`

Дополнительно:
* `make lint` проверка линтером
* `make test` проверка тестами

## Демонстрация

* step 1: https://asciinema.org/a/347951
* step 2: https://asciinema.org/a/357674
* step 3: https://asciinema.org/a/357867
* step 4: https://asciinema.org/a/359012
* step 5: https://asciinema.org/a/359325
