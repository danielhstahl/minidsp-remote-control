import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { UserProvider } from "../../state/userActions";
import GenerateKeyPair from "../GenerateKeyPair";
import { useUserParams } from "../../state/userActions";
import { LocalHeaders } from "../../services/api";
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
        jest.clearAllMocks();
    });
    afterEach(() => {
        localStorage.clear();
    });

    it("Create RSA Key Pair if private key does not exist", () => {
        const mockCreateUser = jest.fn((headers: LocalHeaders, publicKey: string) => Promise.resolve({ userId: "2" }));
        const mockUpdateUser = jest.fn((headers: LocalHeaders, publicKey: string, userId: string) => Promise.resolve({ userId: "2" }));
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
        renderKeyPair()
        expect(screen.getByText("Create RSA Key Pair")).toBeInTheDocument();

    });
    it("Regenerate RSA Key Pair if private key exists", () => {
        savePrivateKey("myprivatekey")
        const mockCreateUser = jest.fn((headers: LocalHeaders, publicKey: string) => Promise.resolve({ userId: "2" }));
        const mockUpdateUser = jest.fn((headers: LocalHeaders, publicKey: string, userId: string) => Promise.resolve({ userId: "2" }));
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
        renderKeyPair()
        expect(screen.getByText("Regenerate RSA Key Pair")).toBeInTheDocument();
    });

    it("Creates user if private key does not exist", async () => {

        const mockCreateUser = jest.fn((headers: LocalHeaders, publicKey: string) => Promise.resolve({ userId: "2" }));
        const mockUpdateUser = jest.fn((headers: LocalHeaders, publicKey: string, userId: string) => Promise.resolve({ userId: "2" }));
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
        renderKeyPair()

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: "Create RSA Key Pair" }));
        })
        await waitFor(() => {
            const userIdElement = screen.getByTestId("userId")
            expect(userIdElement.textContent).toEqual("2")
            const jwtElement = screen.getByTestId("jwt")
            if (jwtElement.textContent !== null) {
                expect(jwtElement.textContent.length).toBeGreaterThan(0)
            }
            expect(mockCreateUser.mock.calls).toHaveLength(1)
            expect(mockUpdateUser.mock.calls).toHaveLength(0)
        })
    });
    it("updates user if user exists", async () => {
        saveUserId("3")
        const mockCreateUser = jest.fn((headers: LocalHeaders, publicKey: string) => Promise.resolve({ userId: "2" }));
        const mockUpdateUser = jest.fn((headers: LocalHeaders, publicKey: string, userId: string) => Promise.resolve({ userId: "2" }));
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
        renderKeyPair()

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: "Create RSA Key Pair" }));
        })
        await waitFor(() => {
            const userIdElement = screen.getByTestId("userId")
            expect(userIdElement.textContent).toEqual("2")
            const jwtElement = screen.getByTestId("jwt")
            if (jwtElement.textContent !== null) {
                expect(jwtElement.textContent.length).toBeGreaterThan(0)
            }
            expect(mockCreateUser.mock.calls).toHaveLength(0)
            expect(mockUpdateUser.mock.calls).toHaveLength(1)
        })
    });
});
