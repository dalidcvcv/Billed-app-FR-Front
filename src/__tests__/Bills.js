/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES,ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import "@testing-library/jest-dom";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
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
      //ajoutde l'expect expression
      expect(windowIcon).toHaveClass("active-icon")
    })

    // test le tri par date
    test("Then bills should be ordered from earliest to latest", () => {
      // Modification du test pour refléter l'ordre des factures dans la vue 
      document.body.innerHTML = BillsUI({ data: bills})
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I click on Nouvelle note de frais", () => {
    test("Then the form to create a new bill should appear", () => {
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname });};

      const billsInit = new Bills({document,onNavigate,store: null,localStorage: window.localStorage,});

      // Mocking and event setup
      const openFormNewBill = jest.fn(billsInit.handleClickNewBill);

      const btnNewBill = screen.getByTestId("btn-new-bill");
      btnNewBill.addEventListener("click", openFormNewBill);

      // User interaction
      userEvent.click(btnNewBill);

      // Assertion
      expect(openFormNewBill).toHaveBeenCalled();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });
  });

  describe("When I am on Bills Page and i click on the eye icon", () => {
    test("Then the receipt that ha been uploaded appears", () => {
      $.fn.modal = jest.fn()
      
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname })}
      const store = null
      const billsView = new Bills({document,onNavigate,store,localStorage: window.localStorage,})
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(billsView.handleClickIconEye)
      iconEye.addEventListener('click', handleClickIconEye(iconEye))
      userEvent.click(iconEye)
      expect(screen.getByText("Justificatif")).toBeTruthy()
    })
  })
  //Tests pages d'erreur//
  describe("When an error occurs on API", () => { //erreur sur l'api
    beforeEach(() => {
      jest.spyOn(mockStore, 'bills')
      Object.defineProperty(window, 'localStorage', {value: localStorageMock})
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee', email: 'a@a'}))
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.appendChild(root)
      router()})

    test("Then i fetch the invoices in the api and it fails with a 404 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("Then i fetch the invoices in the api and it fails with a 500 error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
