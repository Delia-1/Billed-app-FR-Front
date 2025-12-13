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
