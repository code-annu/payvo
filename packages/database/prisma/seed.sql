BEGIN;

INSERT INTO
    "supported_languages" ("code", "name")
VALUES
    ('en', 'English'),
    ('hi', 'Hindi'),
    ('bn', 'Bengali'),
    ('ta', 'Tamil'),
    ('te', 'Telugu') ON CONFLICT ("code") DO
UPDATE
SET
    "name" = EXCLUDED."name";

INSERT INTO
    "supported_currencies" ("code", "name", "minor_unit", "updated_at")
VALUES
    ('INR', 'Indian Rupee', 2, CURRENT_TIMESTAMP),
    ('USD', 'US Dollar', 2, CURRENT_TIMESTAMP),
    ('EUR', 'Euro', 2, CURRENT_TIMESTAMP),
    ('GBP', 'British Pound', 2, CURRENT_TIMESTAMP),
    ('JPY', 'Japanese Yen', 0, CURRENT_TIMESTAMP) ON CONFLICT ("code") DO
UPDATE
SET
    "name" = EXCLUDED."name",
    "minor_unit" = EXCLUDED."minor_unit",
    "is_enabled" = TRUE,
    "updated_at" = CURRENT_TIMESTAMP;

INSERT INTO
    "countries" ("code", "name")
VALUES
    ('US', 'United States'),
    ('CA', 'Canada'),
    ('GB', 'United Kingdom'),
    ('IE', 'Ireland'),
    ('FR', 'France'),
    ('DE', 'Germany'),
    ('ES', 'Spain'),
    ('IT', 'Italy'),
    ('PT', 'Portugal'),
    ('NL', 'Netherlands'),
    ('BE', 'Belgium'),
    ('CH', 'Switzerland'),
    ('AT', 'Austria'),
    ('SE', 'Sweden'),
    ('NO', 'Norway'),
    ('DK', 'Denmark'),
    ('FI', 'Finland'),
    ('PL', 'Poland'),
    ('CZ', 'Czechia'),
    ('GR', 'Greece'),
    ('TR', 'Turkey'),
    ('UA', 'Ukraine'),
    ('RU', 'Russia'),
    ('AU', 'Australia'),
    ('NZ', 'New Zealand'),
    ('JP', 'Japan'),
    ('KR', 'South Korea'),
    ('CN', 'China'),
    ('IN', 'India'),
    ('PK', 'Pakistan'),
    ('BD', 'Bangladesh'),
    ('LK', 'Sri Lanka'),
    ('NP', 'Nepal'),
    ('SG', 'Singapore'),
    ('MY', 'Malaysia'),
    ('TH', 'Thailand'),
    ('VN', 'Vietnam'),
    ('ID', 'Indonesia'),
    ('PH', 'Philippines'),
    ('AE', 'United Arab Emirates'),
    ('SA', 'Saudi Arabia'),
    ('QA', 'Qatar'),
    ('ZA', 'South Africa'),
    ('NG', 'Nigeria'),
    ('KE', 'Kenya'),
    ('EG', 'Egypt'),
    ('BR', 'Brazil'),
    ('MX', 'Mexico'),
    ('AR', 'Argentina'),
    ('CL', 'Chile') ON CONFLICT ("code") DO
UPDATE
SET
    "name" = EXCLUDED."name";

COMMIT;