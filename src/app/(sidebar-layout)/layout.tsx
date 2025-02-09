"use client";

import { PropsWithChildren, useState } from "react";
import {
  Bars3Icon,
  UserIcon,
  CreditCardIcon,
  ArrowPathIcon,
  XMarkIcon,
  WalletIcon,
  DocumentCurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { usePathname } from "next/navigation";

const NAVIGATION = [
  { name: "Profile", href: "/", icon: UserIcon },
  {
    name: "Payment Details",
    href: "/payment-details",
    icon: WalletIcon,
    children: [
      {
        name: "New Card",
        href: "/payment-details/new-card",
        icon: CreditCardIcon,
      },
    ],
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    icon: ArrowPathIcon,
    children: [
      {
        name: "Invoices",
        href: "/subscriptions/invoices",
        icon: DocumentCurrencyDollarIcon,
      },
    ],
  },
];

export default function SidebarLayout({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div>
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-base-content/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>
              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center text-primary-content font-bold tracking-widest">
                  Y-DASH
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="menu menu-lg -mx-4 space-y-1">
                        {NAVIGATION.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className={clsx({
                                "bg-primary-content text-primary hover:text-primary-content":
                                  pathname === item.href,
                                "text-primary-content": pathname !== item.href,
                              })}
                            >
                              <item.icon
                                aria-hidden="true"
                                className="h-5 w-5"
                              />
                              {item.name}
                            </a>
                            {item.children && (
                              <ul>
                                {item.children.map((child) => (
                                  <li key={child.name}>
                                    <a
                                      href={child.href}
                                      className={clsx({
                                        "bg-primary-content text-primary hover:text-primary-content":
                                          pathname === child.href,
                                        "text-primary-content":
                                          pathname !== child.href,
                                      })}
                                    >
                                      <child.icon
                                        aria-hidden="true"
                                        className="h-5 w-5"
                                      />
                                      {child.name}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center text-primary-content font-bold tracking-widest">
              Y-DASH
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="menu -mx-4 space-y-1">
                    {NAVIGATION.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={clsx({
                            "bg-primary-content text-primary hover:text-primary-content":
                              pathname === item.href,
                            "text-primary-content": pathname !== item.href,
                          })}
                        >
                          <item.icon aria-hidden="true" className="h-5 w-5" />
                          {item.name}
                        </a>
                        {item.children && (
                          <ul>
                            {item.children.map((child) => (
                              <li key={child.name}>
                                <a
                                  href={child.href}
                                  className={clsx({
                                    "bg-primary-content text-primary hover:text-primary-content":
                                      pathname === child.href,
                                    "text-primary-content":
                                      pathname !== child.href,
                                  })}
                                >
                                  <child.icon
                                    aria-hidden="true"
                                    className="h-5 w-5"
                                  />
                                  {child.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-base-200 bg-base-100 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-base-content lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>

          <div
            aria-hidden="true"
            className="h-6 w-px bg-base-content/10 lg:hidden"
          />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">Eng</div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </>
  );
}
