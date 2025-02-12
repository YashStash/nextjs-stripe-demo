import { Country, State } from "country-state-city";

const allCountries = Country.getAllCountries();

export function countryToIsoCode(country: string) {
  const selectedCountry = allCountries.find((c) => c.name === country);
  return selectedCountry?.isoCode;
}

export function stateToIsoCode(country: string, state: string) {
  const selectedCountry = allCountries.find((c) => c.name === country);
  const selectedState = State.getStatesOfCountry(selectedCountry?.isoCode).find(
    (s) => s.name === state
  );
  return selectedState?.isoCode;
}

export function isoCodeToCountry(isoCode: string) {
  const selectedCountry = allCountries.find((c) => c.isoCode === isoCode);
  return selectedCountry?.name;
}

export function isoCodeToState(countryIsoCode: string, isoCode: string) {
  const selectedState = State.getStateByCodeAndCountry(isoCode, countryIsoCode);
  return selectedState?.name;
}
