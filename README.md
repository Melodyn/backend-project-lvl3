# Hexlet: "Загрузчик страниц"

[![Github Actions](../../workflows/Node.js%20CI/badge.svg)](../../actions)

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
* `gendiff -h`

Дополнительно:
* `make lint` проверка линтером
* `make test` проверка тестами

## Демонстрация
