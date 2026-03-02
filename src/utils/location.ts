import { Country, State } from 'country-state-city';

export interface CountryOption {
  code: string;
  name: string;
}

export interface StateOption {
  code: string;
  name: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = Country.getAllCountries()
  .map((country) => ({
    code: country.isoCode,
    name: country.name,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const STATES_BY_COUNTRY = new Map<string, StateOption[]>(
  COUNTRY_OPTIONS.map((country) => [
    country.code,
    State.getStatesOfCountry(country.code)
      .map((state) => ({
        code: state.isoCode,
        name: state.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  ]),
);

export function getStateOptions(countryCode: string): StateOption[] {
  if (!countryCode) return [];
  return STATES_BY_COUNTRY.get(countryCode.toUpperCase()) || [];
}
