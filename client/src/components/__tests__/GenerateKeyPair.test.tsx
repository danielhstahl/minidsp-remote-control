import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { UserProvider } from "../../state/userActions";
import GenerateKeyPair from "../GenerateKeyPair";
import { useUserParams } from "../../state/userActions";
import type { LocalHeaders } from "../../services/api";
import { savePrivateKey, saveUserId } from "../../state/persistance";

const WrapperComponent = ({ children }: any) => {
    const {
        state: { userId, jwt },
    } = useUserParams();

    return <div>
        <span data-testid="userId">{userId}</span>
        <span data-testid="jwt">{jwt}</span>
        {children}
    </div>
}
describe("GenerateKeyPair", () => {

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });
    afterEach(() => {
        localStorage.clear();
    });

    it("Create RSA Key Pair if private key does not exist", () => {
        const mockCreateUser = vi.fn((_headers: LocalHeaders, _publicKey: string) => Promise.resolve({ userId: "2" }));
        const mockUpdateUser = vi.fn((_headers: LocalHeaders, _publicKey: string, _userId: string) => Promise.resolve({ userId: "2" }));
        const renderKeyPair = () => {
            return render(
                <UserProvider>
                    <WrapperComponent>
                        <GenerateKeyPair
                            createUserLocal={mockCreateUser}
                            updateUserLocal={mockUpdateUser}
                        />
                    </WrapperComponent>
                </UserProvider>
            );
        };
        const screen = renderKeyPair()
        expect(screen.getByText("Create RSA Key Pair")).toBeInTheDocument();

    });
    it("Regenerate RSA Key Pair if private key exists", async () => {
        savePrivateKey("hello")
        saveUserId("hello")
        const mockCreateUser = vi.fn((_headers: LocalHeaders, _publicKey: string) => Promise.resolve({ userId: "2" }));
        const mockUpdateUser = vi.fn((_headers: LocalHeaders, _publicKey: string, _userId: string) => Promise.resolve({ userId: "2" }));
        const renderKeyPair = () => {
            return render(
                <UserProvider>
                    <WrapperComponent>
                        <GenerateKeyPair
                            createUserLocal={mockCreateUser}
                            updateUserLocal={mockUpdateUser}
                        />
                    </WrapperComponent>
                </UserProvider>
            );
        };
        const screen = renderKeyPair()
        expect(screen.getByText("Regenerate RSA Key Pair")).toBeInTheDocument();
    });

    it("Creates user if private key does not exist", async () => {

        const mockCreateUser = vi.fn((_headers: LocalHeaders, _publicKey: string) => Promise.resolve({ userId: "2" }));
        const mockUpdateUser = vi.fn((_headers: LocalHeaders, _publicKey: string, _userId: string) => Promise.resolve({ userId: "2" }));
        const renderKeyPair = () => {
            return render(
                <UserProvider>
                    <WrapperComponent>
                        <GenerateKeyPair
                            createUserLocal={mockCreateUser}
                            updateUserLocal={mockUpdateUser}
                        />
                    </WrapperComponent>
                </UserProvider>
            );
        };
        const screen = renderKeyPair()

        await screen.getByRole('button', { name: "Create RSA Key Pair" }).click()
        await expect.element(screen.getByTestId("userId")).toHaveTextContent("2")
        expect(mockCreateUser.mock.calls).toHaveLength(1)
        expect(mockUpdateUser.mock.calls).toHaveLength(0)
        //await expect.element(screen.getByTestId("jwt")) .toHaveTextContent("2")

    });
    it("updates user if user exists", async () => {
        saveUserId("3")
        const mockCreateUser = vi.fn((_headers: LocalHeaders, _publicKey: string) => Promise.resolve({ userId: "2" }));
        //guaranteed to return the same userId as in localStorage
        const mockUpdateUser = vi.fn((_headers: LocalHeaders, _publicKey: string, _userId: string) => Promise.resolve({ userId: "3" }));
        const renderKeyPair = () => {
            return render(
                <UserProvider>
                    <WrapperComponent>
                        <GenerateKeyPair
                            createUserLocal={mockCreateUser}
                            updateUserLocal={mockUpdateUser}
                        />
                    </WrapperComponent>
                </UserProvider>
            );
        };
        const screen = renderKeyPair()
        await screen.getByRole('button', { name: "Create RSA Key Pair" }).click()
        await expect.element(screen.getByTestId("userId")).toHaveTextContent("3")
        await vi.waitFor(async () => {
            expect(mockCreateUser.mock.calls).toHaveLength(0)
            expect(mockUpdateUser.mock.calls).toHaveLength(1)
        })


    });
});
