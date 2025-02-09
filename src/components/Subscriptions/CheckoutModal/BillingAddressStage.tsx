"use client";

import { DialogTitle } from "@headlessui/react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { Country, IState, State } from "country-state-city";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const countries = Country.getAllCountries();

type Inputs = {
  country: string;
  state: string;
  postCode: string;
};

async function getBillingAddress(): Promise<{ data: Inputs }> {
  return fetch("/api/profile/billingAddress").then((res) => res.json());
}

async function updateBillingAddress(data: Inputs): Promise<{ data: Inputs }> {
  return fetch("/api/profile/billingAddress", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

interface BillingAddressStageProps {
  onAddressUpdated: VoidFunction;
  onBack?: VoidFunction;
}

export default function BillingAddressStage({
  onAddressUpdated,
  onBack,
}: BillingAddressStageProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<Inputs>();

  const [states, setStates] = useState<IState[]>([]);
  const country = watch("country");
  const state = watch("state");

  useEffect(() => {
    getBillingAddress().then((result) => {
      if (!result.data) {
        return;
      }

      Object.entries(result.data).forEach(([key, value]) => {
        setValue(key as keyof Inputs, value);
      });
    });
  }, [setValue]);

  useEffect(() => {
    if (country) {
      setStates(State.getStatesOfCountry(country));
      setTimeout(() => {
        setValue("state", state);
      }, 1);
    }
  }, [country, setValue, state]);

  async function onSubmit(data: Inputs) {
    const result = await updateBillingAddress(data);

    if (result.data) {
      onAddressUpdated();
    }

    Object.entries(result.data).forEach(([key, value]) => {
      setValue(key as keyof Inputs, value);
    });
  }

  return (
    <>
      <DialogTitle className="font-bold text-lg mb-6 flex gap-2 items-center">
        {onBack && (
          <button className="btn btn-circle btn-xs" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        )}
        Billing Address
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="form-control">
          <div className="label">
            <span className="label-text">Country</span>
          </div>
          <select
            className="select select-bordered"
            disabled={isSubmitting}
            {...register("country", { required: true })}
          >
            <option value="">Select your country</option>
            {countries.map((country) => (
              <option key={country.isoCode} value={country.isoCode}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text">State</span>
          </div>
          <select
            className="select select-bordered"
            disabled={!watch("country") || isSubmitting}
            {...register("state", { required: true })}
          >
            <option value="">Select your state</option>
            {states.map((country) => (
              <option key={country.isoCode} value={country.isoCode}>
                {country.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control mb-4">
          <div className="label">
            <span className="label-text">State</span>
          </div>
          <input
            type="text"
            placeholder="1234"
            className="input input-bordered"
            disabled={!watch("state") || !watch("country") || isSubmitting}
            {...register("postCode", { required: true })}
          />
        </label>
        <button className="btn btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update"}
        </button>
      </form>
    </>
  );
}
