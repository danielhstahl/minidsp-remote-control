import { render } from 'vitest-browser-react'
import { beforeEach, describe, expect, test, vi, } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { Power, Source, Preset, getAuthSettings } from "./services/api"
import * as api from "./services/api"
import App from "./App";
import { createMemoryRouter, RouterProvider } from "react-router";
import { initiateUserState } from "./state/userActions"
import Settings from "./components/Settings";
import { initialExpiryState } from "./state/expiryActions";
import { savePrivateKey, saveUserId } from './state/persistance'
import { AuthSettingsProvider } from "./state/credActions";
import { UserProvider } from "./state/userActions";
import { refreshToken } from "./utils/refresh";


let createRouter = () => {
  return createMemoryRouter([
    {
      path: "/",
      Component: App,
      loader: () => getAuthSettings({}).then(({ requireAuth, key }) => refreshToken(requireAuth, "hello").then(user => ({
        user,
        authSettings: { requireAuth, key }
      }))),
      children: [
        { path: "settings", Component: Settings },
      ]
    }
  ], { initialEntries: ["/settings"] });
}


describe.sequential("login scenarios", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })
  test("renders MiniDSP Remote", async () => {
    const server = setupWorker(
      http.get('/api/status', (_) => {
        return HttpResponse.json({
          power: Power.On,
          source: Source.HDMI,
          volume: -40,
          preset: Preset.preset2
        })
      }),
      http.get('/api/auth/settings', (_) => {
        return HttpResponse.json({ requireAuth: false, key: 1 })
      }),
      http.get('/api/cert/expiration', (_) => {
        return HttpResponse.json(initialExpiryState)
      }),
    )
    await server.start({ quiet: true })
    let router = createMemoryRouter([
      {
        path: "/",
        Component: App,
        loader: () => Promise.resolve({
          user: initiateUserState(),
          authSettings: {
            key: 0,
            requireAuth: true
          }
        }),
        children: [
          { path: "settings", Component: Settings },
        ]
      }
    ]);
    const screen = render(
      <RouterProvider router={router} />
    );
    await expect.element(screen.getByText(/MiniDSP/i)).toBeInTheDocument();
    server.stop()
  })
  test("first time login", async () => {

    const server = setupWorker(
      http.get('/api/status', (_) => {
        return HttpResponse.json({
          power: Power.On,
          source: Source.HDMI,
          volume: -40,
          preset: Preset.preset2
        })
      }),
      http.get('/api/auth/settings', (_) => {
        return HttpResponse.json({ requireAuth: false, key: 1 })
      }),
      http.get('/api/cert/expiration', (_) => {
        return HttpResponse.json(initialExpiryState)
      }),
      http.post('/api/user', (_) => {
        return HttpResponse.json(({ userId: 1 }))
      }),
    )
    await server.start({ quiet: true })
    let router = createRouter()
    const screen = render(
      <AuthSettingsProvider>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </AuthSettingsProvider>
    )
    await expect.element(screen.getByRole("checkbox")).toBeInTheDocument();
    await expect.element(screen.getByRole("checkbox")).toBeDisabled();
    await screen.getByRole('button', { name: "Create RSA Key Pair" }).click()
    await expect.element(screen.getByRole("checkbox")).not.toBeDisabled();
    server.stop()

  })
  test("login after requireAuth set but no private key", async () => {
    const server = setupWorker(
      http.get('/api/status', (_) => {
        return HttpResponse.json({
          power: Power.On,
          source: Source.HDMI,
          volume: -40,
          preset: Preset.preset2
        })
      }),

      http.get('/api/auth/settings', (_) => {
        return HttpResponse.json({ requireAuth: true, key: 1 })
      }),
      http.get('/api/cert/expiration', (_) => {
        return HttpResponse.json(initialExpiryState)
      }),
      http.post('/api/user', (_) => {
        return HttpResponse.json(({ userId: 1 }))
      }),
    )
    await server.start({ quiet: true })
    let router = createRouter()
    const screen = render(
      <AuthSettingsProvider>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </AuthSettingsProvider>
    )
    await expect.element(screen.getByText("No private key locally stored.")).toBeInTheDocument()
    server.stop()
  })
  test("login after requireAuth with existing key", async () => {
    savePrivateKey("MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDefh2YmCsokfMZoFKEoKjIxEHxfgSrARzKznTrv6wzZ1Qer6UHF/74wZoLym6JSRTYR8a8NScX+TrTOHtpKY26UIHU0poOhqQBCd/58JYJaBwOITyuzHLnWnHKPAPbxMrOwGV/VEZeojEj+dbYvsoq0vvVkOkOxQpreEa+VQOi5wy7mjeVOETiZNlkXNqG6ppe54i5DE5XWxUeD7yVrRds0+MUK/yrULBqqgiryevk+Vm59IrxDNYNyuBYQ2qlcQ45LTXBVGSxlphY4g3Fimlt09Y+cdKE6I8U0FcZtw6R6BJI285he8jT+kELQo+yRnWAtZ9EuFib5m+IarbGg6xLAgMBAAECggEAQ87w6zA5OxCcI+vCKmyidCmoJVbwSkO5CDA63xyX+USdFQsYAxzzltG+Rqin3oxY33+kmHiklQBexr/4kLja2nUt1HRpAlNTiYN+cPi7aVuC7WWAzo8917evZWC8Fk8YNkHZzSAcoDvTOTEsIvumtr19hf23oco4nj9WZCyZwpwRwq3APB0TibUucHGL4sjBcdYuZ3tRoE0TJAwt+6jdF29hi+pOhh/xpUuC25e33cWD/NyTnrs3+0AwqE9t8+k2PuNUS/Z/4TvK2jvTkFbtQpkJJEBSFS+qJRWIq7BWRlCUkw+7pEV8lRXW0jhFg2mhpytuzYuNX54X7AEy9Q3RTQKBgQDvSNQ9Ac92a7GkYMbirUmMJhc5bGmhst2hVF4rjKhYQNJs5kiAsediI3P7qKztpHJ9jLEo9L5hXtoupBXScPKsKmgMwcnsaBlMrljgnRFqlbuFzI7yDpClk5DE8iHmei+y9yfSPpU1gRC2lV3lZRhA5k0y3icT/LRxaxNIt8cTVwKBgQDuCP6hiBTkSzPp0K7wFc84KhDvsgV1u6kbkSdfmij23uSHDIwPd3DvUGfCcQ5tXNQFeYX/z1i4LzQ3FxRIt1cT56U2IcIpY579hUs3HWExbRAfAY8GGWkj6+cNtsEwmEN5+gZJW8zPDnbUfz+ZRzZbMph8yzo8QbB9RUi6tM8qLQKBgD6KUXaUh43S/f4RkUnjsspflkha7ozlvAmTjH1jaQiQAK+XzLFeTjSXQZQv9OqzxXzNDey/cxbt/KaeGloDTVn0R3e2GrmgR6SEGRSz2L573iRNX7siVWoBVKA1DOk5XEgxUwYfd04hqqWeComPT7R+vQSjjaEqtlrCeqrR5cVHAoGAKviWtyRw2RG2anRQ0Givgu0dJ5hUof9htOdMW1biJEbyrGqYckZWre0u/gwY1adXYzGf/iE5W+6xl2xkLghjAOXljlMj0QL59bx1apq0LA8LRP2sCybVMzXn/TLLx3EFZWS8c8vNumdbDlt2aL5RUr9chdLOTYhySvsR+Rqg93UCgYEAtEMuRZ3mMUHMzWRwemEA1E9sbZTLLxYeVIDe6TNeRF6B5Acgu+ntAcyjVKtmGVONZJMGeFRRoRMCVgkSALelQ+27iGka7ZuRO4xvdZT0bsLw6PVU5DtTNvaEbkGdm6dAPSWE8+A3D5HSLwTtdIJGfs9fkTI/py9rF9k8IIRCzZw=")
    saveUserId("3")
    vi.mock('./services/api.tsx', { spy: true })
    const statusSpy = vi.mocked(api.getStatus)
    const server = setupWorker(
      http.get('/api/status', () => {
        return HttpResponse.json({
          power: Power.On,
          source: Source.HDMI,
          volume: -40,
          preset: Preset.preset2
        })
      }),

      http.get('/api/auth/settings', (_) => {
        return HttpResponse.json({ requireAuth: true, key: 1 })
      }),
      http.get('/api/cert/expiration', (_) => {
        return HttpResponse.json(initialExpiryState)
      }),
      http.patch('/api/user', (_) => {
        return HttpResponse.json(({ userId: 1 }))
      }),
    )
    await server.start({ quiet: true })
    let router = createRouter()
    const screen = render(
      <AuthSettingsProvider>
        <UserProvider>
          <RouterProvider router={router} />
        </UserProvider>
      </AuthSettingsProvider>
    )
    await expect.element(screen.getByRole("checkbox")).not.toBeDisabled();
    interface StatusInput {
      "x-user-id": string,
      "authorization": string
    }
    const [firstInvocation] = statusSpy.mock.calls as unknown as StatusInput[][]
    const [firstRecord] = firstInvocation
    const userId = firstRecord["x-user-id"]
    const { authorization } = firstRecord
    expect(userId).toEqual("3")
    expect(authorization.startsWith("Bearer")).toBeTruthy()
    server.stop()

  })



})