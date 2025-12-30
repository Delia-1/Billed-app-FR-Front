/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import '@testing-library/jest-dom'
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes"

afterEach(() => {
  document.body.innerHTML = ""
  jest.clearAllMocks()
  localStorage.clear()
})


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then the new bill form is displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const form = screen.getByTestId("form-new-bill")
      //to-do write assertion
      expect(form).toBeInTheDocument()
    })
  })


  describe("When I am on the NewBill Page, there is a 'type de depense' select input", () => {
    describe("When I open the select input and click 'Transport' field", () => {
      test("Then the value displayed for the input is 'Tranport' ", () => {
        // Mettre en place l'ui
        const html = NewBillUI()
        document.body.innerHTML = html
        // Recher de l'input
        const selectInput = screen.getByTestId("expense-type")
        // Faire cliquer sur l'input field "Transports"
        fireEvent.change(selectInput, {
          target: { value: "Transports" }
        })
        // Verifier ce qui est affiché
        expect(selectInput.value).toBe("Transports")
      })
    })
  })

  describe("When I click the 'Nom de la dépense' text field", () => {
    test("Then the default text replaced by my digit ", () => {
      // Mettre en place l'ui
      const html = NewBillUI()
      document.body.innerHTML = html
      // Recher de l'input
      const expenseName = screen.getByTestId("expense-name")
      // Faire cliquer sur l'input field "Transports"
      expect(expenseName.value).toBe("")
      fireEvent.change(expenseName, {
        target: { value: "Repas test" }
      })
      // Verifier ce qui est affiché
      expect(expenseName.value).toBe("Repas test")
    })
  })

  describe("When i select a date on the date picker", () => {
    test("Then the datepicker display the setted date", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const datepicker = screen.getByTestId("datepicker")
      expect(datepicker.value).toBe("")
      fireEvent.change(datepicker, {
        target: { value: "2025-12-25" }
      })
      expect(datepicker.value).toBe("2025-12-25")
    })
  })

  //Montant

  describe("When i digit a new value in the 'Montant' input type number", () => {
    test("Then the value displayed is the one I digited", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const amount = screen.getByTestId("amount")
      expect(amount.value).toBe("")
      fireEvent.change(amount, {
        target: { value: "111" }
      })
      expect(amount.value).toBe("111")
    })
  })

  //TVA
  describe("When i interact with the 'TVA' fields", () => {
    describe("When i digit a new value in the 'VAT' input", () => {
      test("Then the value displayed is the one I digited", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        const vat = screen.getByTestId("vat")
        expect(vat.value).toBe("")
        fireEvent.change(vat, {
          target: { value: "222" }
        })
        expect(vat.value).toBe("222")
      })
    })
    describe("When i digit a new value in the 'PCT' input", () => {
      test("Then the value displayed is the one I digited", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        const pct = screen.getByTestId("pct")
        expect(pct.value).toBe("")
        fireEvent.change(pct, {
          target: { value: "22" }
        })
        expect(pct.value).toBe("22")
      })
    })


  })

  describe("When I digit a text in the text area 'Commentaire' ", () => {
    test("Then the displayed text is the one i digited", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const commentary = screen.getByTestId("commentary")
      expect(commentary.value).toBe("")
      fireEvent.change(commentary, {
        target: { value: "Test the commentary field" }
      })
      expect(commentary.value).toBe("Test the commentary field")
    })
  })

  describe("When I add a document in the 'justificatif' field", () => {

    describe("When the file extension is a correct one", () => {
      test("Then the file is selected and it name retrieved", () => {
        const html = NewBillUI()
        document.body.innerHTML = html
        const fileInput = screen.getByTestId("file")
        const file = new File(["test content"], "test-file.jpg", { type: "image/jpeg" });
        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(fileInput.files.length).toBe(1);
        expect(fileInput.files[0].name).toBe("test-file.jpg")

      })
    })
  })

  describe("When the file extension isn't a correct one", () => {
    test("Then the file isn't selected and an error message is displayed", () => {
    document.body.innerHTML = NewBillUI()

  const store = { bills: () => ({ create: jest.fn() }) }
  const onNavigate = jest.fn()

  new NewBill({ document, onNavigate, store })

  const fileInput = screen.getByTestId("file")
  const file = new File(["x"], "unvalid-test-file.txt", { type: "text/plain" })

  fireEvent.change(fileInput, { target: { files: [file] } })
  const errorMessage = screen.getByTestId("error-message")
  // console.log("coucou", errorMessage)

  expect(fileInput.value).toBe("")
  expect(errorMessage).toBeInTheDocument()
  expect(errorMessage.innerText).toBe("* Veuillez sélectionner un fichier jpg, jpeg ou png.")

    })
  })

  // unit tests to check the submit events
  // tester le submit
  // - es ce que l'email user est bien retrieve
  //  - es ce que le fichier et le nom sont sauvegardés dans formData

  describe("When the form is submitted but required date field isn't filled", () => {
    test("Then the form isn't submitted no bill object has been created", () => {

    })
  })

  describe("When the form is submitted with required data", ()=> {
    test("Then user email should be retrieved from localStorage", () => {
      // remplir le form avec les champs required
      // initialiser le local storage
      // Voir si valeur pour email
    })

    test("Then a bill object should be built and post", () => {

    })

    test("Then I should be redirect on bill page", () => {

    })



  })
  // Test d'intégration POST
  describe ("Given I am a user connected as employee", () => {
    describe("When I navigate to newBill", () => {
       test("I should be redirected to NewBill page", async () => {
        localStorage.setItem("user", JSON.stringify({type:"Employee", email:"e@e"}))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
        // console.log(document.body.innerHTML)
        await waitFor(() => screen.getByText("Envoyer une note de frais"))

        const mailIcon = screen.getByTestId('icon-mail')
        await waitFor(() => screen.getByTestId('icon-mail'))

        expect(mailIcon.classList.contains("active-icon")).toBe(true)

      })
    })

    describe("When the form is correctly filled and submitted ", () => {
      test("then a Bill object with the right data is created", () => {

      })
    })

  })

})
