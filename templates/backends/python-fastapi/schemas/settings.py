from enum import Enum


class Environment(str, Enum):
    DEVELOP = "develop"
    STAGING = "staging"
    PRODUCTION = "production"
