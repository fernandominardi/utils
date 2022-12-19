# Latest version under the main version 2.
FROM composer:2

# Usual working directory when using composer.
WORKDIR /var/www/html

# We set the entrypoint so that the container could work similar to a command.
# The provided parameter is needed to avoid checking if system requirements are met.
ENTRYPOINT [ "composer", "--ignore-platform-reqs" ]
