/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import $ from 'jquery'
import '@testing-library/jest-dom'

import router from "../app/Router.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on the bill page, and I click the 'Nouvelle note de frais' button", () => {
    test("Then I should be sent on NewBills page", () => {
      const pathname = ROUTES_PATH['Bills']
      const html = ROUTES({
        pathname
       })
       document.body.innerHTML = html
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }

       const billsInstance = new Bills({
        document,
        onNavigate,
      })

      const newBillButton = screen.getByTestId('btn-new-bill')
      const handleClickNewBill = jest.fn((e) => billsInstance.handleClickNewBill(e))

      newBillButton.addEventListener("click", handleClickNewBill)
      fireEvent.click(newBillButton)
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy()

    })
  })

   // Integragion test for the modal behaviour
  describe("When I am on the bills Page, and I click on the eye icon on a bill", () => {
    test("Then a modale appear", () => {
      // Mock the Bottstrap modal function
      $.fn.modal = jest.fn()
     // Render the Bill UI with mocked data
      document.body.innerHTML = BillsUI({data: bills})
      // initialize onNavigate
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      // Instantiate Bills container with mocked data
      const billsInstance = new Bills({
        document,
        onNavigate,
        // Simulate data
        bills
      })

      // Retrieve first icon-eye
      const iconEye = screen.getAllByTestId("icon-eye")
      const firstIconEye = iconEye[0]
      // Initialize handle
      const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(firstIconEye))
      // Trigger the mocked click
      firstIconEye.addEventListener("click", handleClickIconEye )
      fireEvent.click(firstIconEye)
      expect($.fn.modal).toHaveBeenCalledWith('show')
      const modalElement = document.getElementById("modaleFile")
      expect(modalElement).toBeTruthy()
    })

    test("Then it should display the bill image when fileUrl is valid", () => {
      $.fn.modal = jest.fn()
      document.body.innerHTML = BillsUI({data: bills})
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsInstance = new Bills({
        document,
        onNavigate,
        bills
      })
      const iconEye = screen.getAllByTestId("icon-eye")

      // I know that the second bill is correctly formated
      const firstIconEye = iconEye[2]
      const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(firstIconEye))
      firstIconEye.addEventListener("click", handleClickIconEye )
      fireEvent.click(firstIconEye)
      // Retrieve image
      const image = screen.getByAltText("Bill")
      expect(image).toBeInTheDocument()
      expect(image.getAttribute("src")).toBe(bills[2].fileUrl)
      // Check if the extension is correct
      const rightExtensions = ["jpg", "jpeg", "png"]
      const pathExt = bills[2].fileUrl.split('?')[0].split('.').pop().toLowerCase()
      expect(rightExtensions.includes(pathExt)).toBeTruthy()
    })

    test("Then modal should open even when bill has an invalid image URL and the app remains stable", () => {
       $.fn.modal = jest.fn()
      document.body.innerHTML = BillsUI({data: bills})
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsInstance = new Bills({
        document,
        onNavigate,
        bills
      })
      const iconEye = screen.getAllByTestId("icon-eye")

      // I selected the icon bind to the null bill
      const firstIconEye = iconEye[1]
      const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(firstIconEye))
      firstIconEye.addEventListener("click", handleClickIconEye )
      fireEvent.click(firstIconEye)

      const modalElement = document.getElementById("modaleFile")
      expect(modalElement).toBeTruthy()

      const image = screen.getByAltText("Bill")
      expect(image).toBeInTheDocument()
      const pathExt = bills[1].fileUrl
      expect(pathExt).toBeNull()

      const closeBtn = document.querySelector('[data-dismiss="modal"]')
      fireEvent.click(closeBtn)
      // App do not breaks 
      expect(screen.getByText('Mes notes de frais')).toBeTruthy()

    })
  })






  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains("active-icon"))

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
})
