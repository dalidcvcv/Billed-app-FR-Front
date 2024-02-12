/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"
import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import { ROUTES } from '../constants/routes'
import mockStore from "../__mocks__/store.js"

window.alert = jest.fn()
jest.mock("../app/Store", () => mockStore)



describe("Given I am connected as an employee", () => {//je suis connecté en tant qu'employée
  Object.defineProperty(window, 'localStorage', { value: localStorageMock 
  })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))

// Description du scénario : Lorsque je suis sur une nouvelle facture et que les champs date, TTC et fichier joint sont vides
  describe("When I am on a newbill and the date, ttc and attached file fields are empty", () => { 
    test ("Then the newbill stay on screen ", () => {//la note de frais reste à l'écran

     
      const html = NewBillUI()   //page de nouvelle note de frais    
      document.body.innerHTML = html
      
      //Les champs date, ttc et fichier joint vides
      const date = screen.getByTestId("datepicker"); //Champ de la date
      expect(date.value).toBe("");

      const ttc = screen.getByTestId("amount"); //Champ du TTC
      expect(ttc.value).toBe(""); 

      const fichier = screen.getByTestId("file") //Champ du fichier
      expect(fichier.value).toBe("")

      const formNewBill = screen.getByTestId("form-new-bill") //Selectionne le formulaire de la nouvelle note de frais
      expect(formNewBill).toBeTruthy() //le formulaire vide apparait correctement
      
      const envoiNewBill = jest.fn((e) => e.preventDefault()) // Empêche le comportement par défaut
      formNewBill.addEventListener("submit", envoiNewBill) // Gestionnaire d'événement pour le formulaire lors de la soumission
      fireEvent.submit(formNewBill) // Simulation de soumission du formulaire
      expect(screen.getByTestId("form-new-bill")).toBeTruthy() //après l'évènement le formulaire reste à l'écran
    })
  })

  // Test : Lorsque je télécharge un fichier joint au format correct
  describe("When i download the attached file in the correct format ", () => {
    test ("Then the newbill is sent", () => { // Alors : La nouvelle note de frais est envoyée avec succès
      
      const html = NewBillUI() 
      document.body.innerHTML = html
      const onNavigate = (pathname) => {document.body.innerHTML = ROUTES({ pathname})}

      // Création d'une nouvelle note de frais
      const newBill = new NewBill({document, onNavigate, store: mockStore, localStorage: window, localStorage})
      // Création d'une fonction simulée pour handleChangeFile 
      const chargeFichier = jest.fn((e) => newBill.handleChangeFile(e))
      
      const fichier = screen.getByTestId("file") // Sélectionne le champ fichier
      const testFormat = new File(["c'est un test"],  "test.jpg", {type: "image/jpg"})
      fichier.addEventListener("change", chargeFichier) 
      fireEvent.change(fichier, {target: {files: [testFormat]}})
      
      expect(chargeFichier).toHaveBeenCalled()
      expect(fichier.files[0]).toStrictEqual(testFormat)

      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeTruthy()

      const envoiNewBill = jest.fn((e) => newBill.handleSubmit(e))
      formNewBill.addEventListener('submit', envoiNewBill)
      fireEvent.submit(formNewBill)
      expect(envoiNewBill).toHaveBeenCalled()
      expect(screen.getByText('Mes notes de frais')).toBeTruthy()
    })
  
  })

  // Test : Lorsque je télécharge un fichier joint au format incorrect
  describe("When i download the attached file in the wrong format", () => {  
    test ("Then i stay on the newbill and a message appears", () => { //Reste sur la page newbill tout en affichant un message.
      
      const html = NewBillUI()          
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname})
      }
      const newBill = new NewBill({ 
        document,
        onNavigate,
        store: null,
        localStorage: window, localStorage,
      })
      const chargeFichier = jest.fn((e) => newBill.handleChangeFile(e))
      const fichier = screen.getByTestId("file")
      const testFormat = new File(["c'est un test"], {
      type: "document/txt"
      })
      fichier.addEventListener("change", chargeFichier)
      fireEvent.change(fichier, {target: {files: [testFormat]}})
      
      expect(chargeFichier).toHaveBeenCalled()
      expect(window.alert).toBeTruthy()
    })
  })

  // Description du scénario : Lorsque le formulaire est rempli correctement et est validé avec le bouton envoyer//
  describe("When I fill out the form and submit it", () => {
    test("Then the form should be successfully submitted",  () => { // Le formulaire doit être envoyé vers la page des factures//

      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBillEnCours = new NewBill({  
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })
      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeTruthy()

      const envoiNewBill = jest.fn((e) => newBillEnCours.handleSubmit(e))
      formNewBill.addEventListener('submit', envoiNewBill)
      fireEvent.submit(formNewBill)
      expect(envoiNewBill).toHaveBeenCalled()
      expect(screen.getByText('Mes notes de frais')).toBeTruthy()
    })
  })
})