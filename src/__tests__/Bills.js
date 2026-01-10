/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import "@testing-library/jest-dom";
import mockStore from "../__mocks__/store";
import router from "../app/Router";

afterEach(() => {
  document.body.innerHTML = "";
  jest.clearAllMocks();
});

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When Bills constructor fails to build the new bill button", () => {
    test(" Then the app does not crash when there is no new bill button", () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      // Initialize Bills
      new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: window.localStorage,
      });

      // Force a null return for the button (buttonNewBill is initialized first)
      const querySelectorSpy = jest
        .spyOn(document, "querySelector")
        .mockReturnValueOnce(null);

      // Check if there isn't any crash if the button is broken
      expect(() => {
        new Bills({
          document,
          onNavigate: jest.fn(),
          store: null,
          localStorage: window.localStorage,
        });
      }).not.toThrow();
      // Restore mocks
      querySelectorSpy.mockRestore();
      localStorage.clear();
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on the bill page, and I click the 'Nouvelle note de frais' button", () => {
    test("Then I should be sent on NewBills page", () => {
      // Define the path
      const pathname = ROUTES_PATH["Bills"];
      document.body.innerHTML = ROUTES({
        pathname,
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // instantiate bill Container
      new Bills({
        document,
        onNavigate,
      });

      const newBillButton = screen.getByTestId("btn-new-bill");
      // Simullate the user click
      fireEvent.click(newBillButton);
      expect(screen.getByText("Envoyer une note de frais")).toBeInTheDocument();
    });
  });

  // Integragion test for the modal behaviour
  describe("When I am on the bills Page, and I click on the eye icon on a bill", () => {
    test("Then a modale appear", () => {
      // Mock the Bootstrap modal function
      $.fn.modal = jest.fn();
      // Render the Bill UI with mocked data
      document.body.innerHTML = BillsUI({ data: bills });
      // Instantiate Bills container with mocked data
      new Bills({
        document,
        // onNavigate,
      });

      // Retrieve first icon-eye
      const iconEye = screen.getAllByTestId("icon-eye");
      const firstIconEye = iconEye[0];

      // Trigger the simulate click
      fireEvent.click(firstIconEye);

      expect($.fn.modal).toHaveBeenCalledWith("show");
      expect(screen.getByText("Justificatif")).toBeInTheDocument();
    });

    test("Then it should display the bill image when fileUrl is valid", () => {
      // Mock the Bootstrap modal function
      $.fn.modal = jest.fn();
      // Data from fixture cause just display test no call on backend
      document.body.innerHTML = BillsUI({ data: bills });
      new Bills({
        document,
        bills,
      });
      const iconEye = screen.getAllByTestId("icon-eye");

      // I know that the third bill is correctly formated
      const thirdIconEye = iconEye[2];
      fireEvent.click(thirdIconEye);
      // Retrieve image
      const image = screen.getByAltText("Bill");
      expect(image).toBeInTheDocument();
      expect(image.getAttribute("src")).toBe(bills[2].fileUrl);
      // Check if the extension is correct
      const rightExtensions = ["jpg", "jpeg", "png"];
      const pathExt = bills[2].fileUrl
        .split("?")[0]
        .split(".")
        .pop()
        .toLowerCase();
      expect(rightExtensions.includes(pathExt)).toBeTruthy();
    });

    test("Then modal should open even when bill has an invalid image URL and the app remains stable", () => {
      $.fn.modal = jest.fn();
      document.body.innerHTML = BillsUI({ data: bills });
      new Bills({
        document,
        bills,
      });
      const iconEye = screen.getAllByTestId("icon-eye");

      // I selected the second icon bind to the null bill
      const secondIconEye = iconEye[1];
      fireEvent.click(secondIconEye);
      //Check for modal title
      expect(screen.getByText("Justificatif")).toBeInTheDocument();
      //Check for the image
      expect(screen.getByAltText("Bill")).toBeInTheDocument();
      // Check if modal has been openened
      expect($.fn.modal).toHaveBeenCalledWith("show");

      // App remains stable/ do not crash when closed
      const closeBtn = document.querySelector('[data-dismiss="modal"]');
      fireEvent.click(closeBtn);
      // Main page still visible on modal Close
      expect(screen.getByText("Mes notes de frais")).toBeInTheDocument();
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    // GetBills
    describe("when there is data to display", () => {
      test("Then getBills returns undefined when no store is provided", () => {
        // Simulate a Bills instance without a store
        const billsInstance = new Bills({
          document,
          // No store
          store: null,
        });

        const result = billsInstance.getBills();
        expect(result).toBeUndefined();
      });

      test("Then moked bills are fetched and displayed in the table", async () => {
        // Retrieve mocked data
        const snapshot = await mockStore.bills().list();
        // Instantiate bills
        const billsInstance = new Bills({
          document,
          store: mockStore,
        });
        // Run the function
        const result = await billsInstance.getBills();
        document.body.innerHTML = BillsUI({ data: result });

        // Check if all the data is fetched
        expect(result.length).toBe(snapshot.length);

        const firstBillName = snapshot[0].name;
        const firstBillAmount = snapshot[0].amount;
        const firstBillType = snapshot[0].type;

        const tableBody = screen.getByTestId("tbody");
        const firstRow = tableBody.getElementsByTagName("tr")[0];

        expect(firstRow).toHaveTextContent(firstBillName);
        expect(firstRow).toHaveTextContent(firstBillAmount);
        expect(firstRow).toHaveTextContent(firstBillType);
      });

      test("Then bills are fetched even with empty data", async () => {
        // Mock to return an empty snapshot
        const listSpy = jest
          .spyOn(mockStore.bills(), "list")
          .mockResolvedValueOnce([]);

        const billsInstance = new Bills({
          document,
          store: mockStore,
        });
        // Call and run the function
        const result = await billsInstance.getBills();

        // Expect an empty array if no bills
        expect(result).toEqual([]);

        document.body.innerHTML = BillsUI({ data: result });
        // Check if there is the table, empty
        const tableBody = screen.getByTestId("tbody");
        expect(tableBody.children.length).toBe(0);
        listSpy.mockRestore();
        document.body.innerHTML = "";
      });

      // test("Then bills rows should be displayed in the page", async () => {
      //   //TODO: Vérifier exactement le html généré textes, icons, status
      //   // Faire fonctionner le screen.debug et les console.log
      //   // Il faut que le test soit en erreur afin de visualiser la data voulu
      //   // Bills mocké ou non?

      //   const snapshot = await mockStore.bills().list();

      //   document.body.innerHTML = BillsUI({ data: snapshot });
      //   //presence de tr dans tbody
      //   // Instanciate bills Table Body
      //   const billsBody = screen.getByTestId("tbody");
      //   // Instanciate first occurence of a row
      //   const billsRow = billsBody.getElementsByTagName("tr")[0];
      //   // Check if the container is filled
      //   expect(billsBody.children.length).toBeGreaterThan(0);
      //   // Chek the type of content in billsBody
      //   expect(billsBody).toContainElement(billsRow);
      // });

      describe("When data is fetched the status is formated correctly", () => {
        test("Then i should have the same number of pending bills in the mock and in the processed data", async () => {
          // Instantiate bills
          const billsInstance = new Bills({
            document,
            store: mockStore,
          });
          // Run the function
          const processedBills = await billsInstance.getBills();

          document.body.innerHTML = BillsUI({ data: processedBills });

          // check the number of rows in the table
          const tableBody = screen.getByTestId("tbody");
          expect(tableBody.children.length).toBe(processedBills.length);

          // Retrieve bills with pending status
          const pendingBills = processedBills.filter(
            (bill) => bill.status === "En attente"
          );
          // Vérifier combien de fois "En attente" apparaît dans l'UI
          // Check how many time the text "en attente" is displayed in the UI
          const pendingStatusElements = screen.getAllByText("En attente");
          expect(pendingStatusElements.length).toBe(pendingBills.length);
          expect(pendingStatusElements.length).toBe(1);
        });

        test("Then i should have the same number of refused bills in the mock and in the processed data", async () => {
          const billsInstance = new Bills({
            document,
            store: mockStore,
          });
          // Run the function
          const processedBills = await billsInstance.getBills();

          document.body.innerHTML = BillsUI({ data: processedBills });
          const tableBody = screen.getByTestId("tbody");
          expect(tableBody.children.length).toBe(processedBills.length);
          const refusedBills = processedBills.filter(
            (bill) => bill.status === "Refused"
          );

          const refusedStatusElements = screen.getAllByText("Refused");
          expect(refusedStatusElements.length).toBe(refusedBills.length);
          expect(refusedStatusElements.length).toBe(2);
        });

        test("Then i should have the same number of accepted bills in the mock and in the processed data", async () => {
          const billsInstance = new Bills({
            document,
            store: mockStore,
          });
          // Run the function
          const processedBills = await billsInstance.getBills();

          document.body.innerHTML = BillsUI({ data: processedBills });
          const tableBody = screen.getByTestId("tbody");
          expect(tableBody.children.length).toBe(processedBills.length);
          const acceptedBills = processedBills.filter(
            (bill) => bill.status === "Accepté"
          );

          const acceptedStatusElements = screen.getAllByText("Accepté");
          expect(acceptedStatusElements.length).toBe(acceptedBills.length);
          expect(acceptedStatusElements.length).toBe(1);
        });

        test("Then bills should be ordered from newest to oldest", async () => {
          // Tous les mocks a utilisr depuis fichié mocké
          // const unsortedBills = [
          //   { date: "2023-10-01" },
          //   { date: "2023-12-01" },
          //   { date: "2023-11-01" },
          // ];
          const billsFromApi = await mockStore.bills().list();

          // Render ui
          document.body.innerHTML = BillsUI({ data: billsFromApi });

          // Retrieve displayed dates(third column) skipping header row
          const rows = screen.getAllByRole("row").slice(1); // skip header row
          const dates = rows.map(
            (row) => row.querySelectorAll("td")[2].textContent
          );

          // Check date order
          for (let i = 0; i < dates.length - 1; i++) {
            expect(new Date(dates[i]).getTime()).toBeGreaterThanOrEqual(
              new Date(dates[i + 1]).getTime()
            );
          }
        });
      });
    });

    describe("When an error occured", () => {
      describe("When bills data is corrupted ", () => {
        test("Then an error message appear in the console", async () => {
          // Mock formatDate to simulate on error on the api
          const formatDateMock = jest
            .spyOn(require("../app/format.js"), "formatDate")
            .mockImplementation(() => {
              throw new Error("Format Error");
            });
          // Spy on the console.log to check if it has been called
          const consoleSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => {});
          const billsInstance = new Bills({
            document,
            onNavigate: jest.fn(),
            store: mockStore,
          });
          // Call and Run getBills()
          await billsInstance.getBills();
          // Check if the log has been displayd for each mocked bill (4)
          expect(consoleSpy).toHaveBeenCalledTimes(bills.length);

          // Restore mocks
          consoleSpy.mockRestore();
          formatDateMock.mockRestore();
        });
      });
    });
  });
});

// get integration test
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);

      // Title match the Bills page title
      await waitFor(() => screen.getByText("Mes notes de frais"));

      // Check that the tables contains rows
      const tbody = screen.getByTestId("tbody");
      expect(tbody.querySelectorAll("tr").length).toBeGreaterThan(0);

      // Check that a bill name is displayed on the page
      expect(document.body.textContent).toContain("vol retour");
    });
    describe("When an error occurs on API", () => {
      test("fetches bills from API and fails with 404 error message", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 404")),
        }));
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);

        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches bills from API and fails with 500 error message", async () => {
        mockStore.bills.mockImplementationOnce(() => ({
          list: () => Promise.reject(new Error("Erreur 500")),
        }));

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);

        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
