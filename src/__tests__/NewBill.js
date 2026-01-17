/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Set up the mock localStorage and mock user for the test
    Object.defineProperty(window, "localStorage", { value: localStorageMock });

    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
  });

  describe("Unit Tests", () => {
    describe("When I am on NewBill Page", () => {
      test("Then the mail icon in vertical layout should be highlighted", async () => {
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);

        router();
        window.onNavigate(ROUTES_PATH.NewBill);

        await waitFor(() => screen.getByTestId("icon-mail"));
        const mailIcon = screen.getByTestId("icon-mail");

        expect(mailIcon.classList).toContain("active-icon");
      });

      test("Then it should retrieve the email from localStorage", () => {
        // Stock a new user value in the localStorage
        const user = { type: "Employee", email: "a@b" };
        window.localStorage.setItem("user", JSON.stringify(user));

        // Retrieve raw value from localStorage
        // "{\"type\":\"Employee\",\"email\":\"a@b\"}"
        const storedUser = window.localStorage.getItem("user");

        // Uncode twice to get object
        // check localStorage { type: 'Employee', email: 'a@b' }
        const parsedOnce = JSON.parse(storedUser);
        const parsedUser =
          typeof parsedOnce === "string" ? JSON.parse(parsedOnce) : parsedOnce;

        // Check mail
        expect(parsedUser.email).toBe("a@b");
      });
    });

    describe("When I upload a file", () => {
      let newBill;
      let handleChangeFile;

      beforeEach(() => {
        document.body.innerHTML = NewBillUI();

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      });

      test("then handleChangeFile should be triggered ", async () => {
        // get the input file element and add the event listener
        await waitFor(() => screen.getByTestId("file"));
        const inputFile = screen.getByTestId("file");

        inputFile.addEventListener("change", handleChangeFile);

        // creation of the test file to upload
        const testFile = new File(["test"], "test.jpg", { type: "image/jpg" });

        // simulate the file upload
        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        });

        // check that the file name is displayed
        expect(screen.getByTestId("file").files[0].name).toBe("test.jpg");

        // check that handleChangeFile is called
        expect(handleChangeFile).toHaveBeenCalled();

        // check formdata values
        expect(inputFile.files[0]).toEqual(testFile);
      });

      test("Then handleChangeFile should be triggered with a valid file", async () => {
        // Wait for the UI to be ready
        await waitFor(() => screen.getByTestId("file"));
        const inputFile = screen.getByTestId("file");

        inputFile.addEventListener("change", handleChangeFile);

        const testFile = new File(["test"], "test.jpg", { type: "image/jpg" });
        // Lauch action
        fireEvent.change(inputFile, {
          target: {
            files: [testFile],
          },
        });

        expect(screen.getByTestId("file").files[0].name).toBe("test.jpg");
        expect(handleChangeFile).toHaveBeenCalled();
      });

      test("Then an error message is displayed when extension is incorrect", async () => {
        const fileInput = screen.getByTestId("file");
        const wrongFile = new File(["x"], "test.pdf", {
          type: "application/pdf",
        });

        // Force input.files
        Object.defineProperty(fileInput, "files", {
          value: [wrongFile],
        });

        // Dispatch a real change event with target.value (without touching input.value)
        const event = new Event("change", { bubbles: true });
        Object.defineProperty(event, "target", {
          value: { value: "C:\\fakepath\\test.pdf" },
        });
        fileInput.dispatchEvent(event);

        const errorMessage = await screen.findByTestId("error-message");
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.innerText).toBe(
          "* Veuillez sélectionner un fichier jpg, jpeg ou png."
        );
        expect(fileInput.value).toBe("");
      });

      test("billId, fileUrl, fileName are set after upload", async () => {
        const originalBills = mockStore.bills;

        mockStore.bills = jest.fn(() => ({
          create: jest.fn(() =>
            Promise.resolve({
              filePath: "https://localhost:3456/images/test.jpg",
              key: "1234",
            })
          ),
        }));

        const newBill = new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage: window.localStorage,
        });

        const inputFile = screen.getByTestId("file");
        const testFile = new File(["test"], "test.jpg", { type: "image/jpg" });

        // Set files sans toucher à value
        Object.defineProperty(inputFile, "files", {
          value: [testFile],
        });

        // Event fake avec value (sans setter input.value)
        const fakeEvent = {
          preventDefault: jest.fn(),
          target: { value: "C:\\fakepath\\test.jpg" },
        };

        newBill.handleChangeFile(fakeEvent);

        await waitFor(() => {
          expect(newBill.billId).toBe("1234");
          expect(newBill.fileUrl).toBe(
            "https://localhost:3456/images/test.jpg"
          );
          expect(newBill.fileName).toBe("test.jpg");
        });

        expect(inputFile.files[0].name).toBe("test.jpg");

        mockStore.bills = originalBills;
      });
    });

    describe("When I submit the new bill form", () => {
      test("Then the bill object should be correctly constructed", () => {
        // Render the NewBill UI
        document.body.innerHTML = NewBillUI();

        // Provide a mocked localStorage to the window object
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });

        // Force the value returned by localStorage.getItem("user")
        //This is required because handleSubmit reads from the global localStorage
        //and not from the injected this.localStorage.

        jest
          .spyOn(window.localStorage, "getItem")
          .mockReturnValue(JSON.stringify({ email: "test@test.com" }));

        // Navigation mock
        const onNavigate = jest.fn();

        // Mock store with update method (used on submit)
        const store = {
          bills: jest.fn(() => ({
            update: jest.fn(() => Promise.resolve()),
            create: jest.fn(),
          })),
        };

        // Instantiate NewBill container
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        // Spy on updateBill to capture the constructed bill object
        const updateBillSpy = jest.spyOn(newBill, "updateBill");

        // Fill in the form fields
        screen.getByTestId("expense-type").value = "Transports";
        screen.getByTestId("expense-name").value = "Test Expense";
        screen.getByTestId("amount").value = "100";
        screen.getByTestId("datepicker").value = "2025-12-25";
        screen.getByTestId("vat").value = "20";
        screen.getByTestId("pct").value = "10";
        screen.getByTestId("commentary").value = "Test commentary";

        // Simulate a previously uploaded file
        newBill.fileUrl = "test-url";
        newBill.fileName = "test-file.jpg";

        // Submit the form
        fireEvent.submit(screen.getByTestId("form-new-bill"));

        // Expected bill object built by handleSubmit
        const expectedBill = {
          email: "test@test.com",
          type: "Transports",
          name: "Test Expense",
          amount: 100,
          date: "2025-12-25",
          vat: "20",
          pct: 10,
          commentary: "Test commentary",
          fileUrl: "test-url",
          fileName: "test-file.jpg",
          status: "pending",
        };

        expect(updateBillSpy).toHaveBeenCalledTimes(1);
        expect(updateBillSpy).toHaveBeenCalledWith(expectedBill);
      });
    });
  });

  // Post integration
  describe("Given I am connected as an employee and I submit a new bill", () => {
    const originalBills = mockStore.bills;

    beforeEach(() => {
      jest.clearAllMocks();
      document.body.innerHTML = NewBillUI();
    });

    afterEach(() => {
      mockStore.bills = originalBills;
    });

    test("If file is missing, it should NOT navigate and NOT call update", () => {
      document.body.innerHTML = NewBillUI();

      const updateMock = jest.fn();
      const store = { bills: jest.fn(() => ({ update: updateMock })) };
      const onNavigate = jest.fn();

      new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Fill the form except fileUrl and fileName
      fireEvent.change(screen.getByTestId("expense-type"), {
        target: { value: "Transports" },
      });
      fireEvent.change(screen.getByTestId("expense-name"), {
        target: { value: "Taxi" },
      });
      fireEvent.change(screen.getByTestId("datepicker"), {
        target: { value: "2023-04-01" },
      });
      fireEvent.change(screen.getByTestId("amount"), {
        target: { value: "42" },
      });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "18" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("commentary"), {
        target: { value: "test" },
      });

      fireEvent.submit(screen.getByTestId("form-new-bill"));

      expect(updateMock).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });

    describe("When the API successfully updates the bill", () => {
      test(" Then Submiting a new bill navigates to Bills and displays the created bill (Taxi)", async () => {
        document.body.innerHTML = `
          <div id="root"></div>
          <div id="layout-icon1"></div>
          <div id="layout-icon2"></div>
        `;

        // Simulate a "DB"  that will be returned by list()
        const billsDB = [];

        const updateMock = jest.fn(() => Promise.resolve());
        const listMock = jest.fn(() => Promise.resolve(billsDB));

        mockStore.bills = jest.fn(() => ({
          update: updateMock,
          list: listMock,
        }));

        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        await waitFor(() => screen.getByTestId("form-new-bill"));

        // Create NewBill with real router navigation
        const newBill = new NewBill({
          document,
          onNavigate: window.onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Simulate upload OK
        newBill.billId = "1234";
        newBill.fileUrl = "https://localhost:3456/images/test.jpg";
        newBill.fileName = "test.jpg";

        // Fill form with Taxi
        fireEvent.change(screen.getByTestId("expense-type"), {
          target: { value: "Transports" },
        });
        fireEvent.change(screen.getByTestId("expense-name"), {
          target: { value: "Taxi" },
        });
        fireEvent.change(screen.getByTestId("datepicker"), {
          target: { value: "2023-04-01" },
        });
        fireEvent.change(screen.getByTestId("amount"), {
          target: { value: "42" },
        });
        fireEvent.change(screen.getByTestId("vat"), {
          target: { value: "18" },
        });
        fireEvent.change(screen.getByTestId("pct"), {
          target: { value: "20" },
        });
        fireEvent.change(screen.getByTestId("commentary"), {
          target: { value: "test" },
        });

        // Push the "created" bill into our DB BEFORE we navigate to Bills
        billsDB.push({
          date: "2023-04-01",
          name: "Taxi",
          type: "Transports",
          amount: 42,
          status: "pending",
          fileUrl: "https://localhost:3456/images/test.jpg",
        });

        fireEvent.submit(screen.getByTestId("form-new-bill"));

        await waitFor(() => {
          expect(updateMock).toHaveBeenCalled();
          expect(screen.getByText("Mes notes de frais")).toBeInTheDocument();
          expect(screen.getByText("Taxi")).toBeInTheDocument();
        });
      });
    });

    describe("When the API returns a 500 error during bill update", () => {
      test("Then it should log the error (console.error)", async () => {
        document.body.innerHTML = NewBillUI();
        mockStore.bills = jest.fn(() => ({
          update: jest.fn(() => Promise.reject(new Error("Erreur 500"))),
        }));

        const onNavigate = jest.fn();

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Submit need fileUrl, fileName, and billId
        newBill.billId = "1234";
        newBill.fileUrl = "https://localhost:3456/images/test.jpg";
        newBill.fileName = "test.jpg";

        fireEvent.change(screen.getByTestId("expense-type"), {
          target: { value: "Transports" },
        });
        fireEvent.change(screen.getByTestId("expense-name"), {
          target: { value: "Taxi" },
        });
        fireEvent.change(screen.getByTestId("datepicker"), {
          target: { value: "2023-04-01" },
        });
        fireEvent.change(screen.getByTestId("amount"), {
          target: { value: "42" },
        });
        fireEvent.change(screen.getByTestId("vat"), {
          target: { value: "18" },
        });
        fireEvent.change(screen.getByTestId("pct"), {
          target: { value: "20" },
        });
        fireEvent.change(screen.getByTestId("commentary"), {
          target: { value: "test" },
        });

        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        // Real submit
        fireEvent.submit(screen.getByTestId("form-new-bill"));

        // In the code nav is called even if API fails
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);

        // Error must be logged and promise rejected
        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalled();
        });

        consoleErrorSpy.mockRestore();
      });
    });

    describe("When the API returns a 404 error during bill update", () => {
      test("Then it should log the error (console.error)", async () => {
        document.body.innerHTML = NewBillUI();

        mockStore.bills = jest.fn(() => ({
          update: jest.fn(() => Promise.reject(new Error("Erreur 404"))),
        }));

        const onNavigate = jest.fn();

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        newBill.billId = "1234";
        newBill.fileUrl = "https://localhost:3456/images/test.jpg";
        newBill.fileName = "test.jpg";

        fireEvent.change(screen.getByTestId("expense-type"), {
          target: { value: "Transports" },
        });
        fireEvent.change(screen.getByTestId("expense-name"), {
          target: { value: "Taxi" },
        });
        fireEvent.change(screen.getByTestId("datepicker"), {
          target: { value: "2023-04-01" },
        });
        fireEvent.change(screen.getByTestId("amount"), {
          target: { value: "42" },
        });
        fireEvent.change(screen.getByTestId("vat"), {
          target: { value: "18" },
        });
        fireEvent.change(screen.getByTestId("pct"), {
          target: { value: "20" },
        });
        fireEvent.change(screen.getByTestId("commentary"), {
          target: { value: "test" },
        });

        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        fireEvent.submit(screen.getByTestId("form-new-bill"));

        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);

        await waitFor(() => {
          expect(consoleErrorSpy).toHaveBeenCalled();
        });

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
