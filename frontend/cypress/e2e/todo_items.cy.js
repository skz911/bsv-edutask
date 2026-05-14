const apiUrl = 'http://localhost:5000'

function createUserAndTask() {
  cy.fixture('user.json').then((userFixture) => {
    const user = {
      ...userFixture,
      email: `r8-${Date.now()}-${Cypress._.random(100000)}@example.com`
    }

    cy.request({
      method: 'POST',
      url: `${apiUrl}/users/create`,
      form: true,
      body: user
    }).then((userResponse) => {
      const userId = userResponse.body._id.$oid

      cy.wrap(user).as('user')
      cy.wrap(userId).as('userId')

      cy.fixture('task.json').then((taskFixture) => {
        const task = {
          ...taskFixture,
          title: `${taskFixture.title} ${Date.now()} ${Cypress._.random(100000)}`
        }

        cy.request({
          method: 'POST',
          url: `${apiUrl}/tasks/create`,
          form: true,
          body: {
            ...task,
            userid: userId
          }
        }).then((taskResponse) => {
          const createdTask = taskResponse.body.find((candidate) => candidate.title === task.title)

          cy.wrap(task).as('task')
          cy.wrap(createdTask._id.$oid).as('taskId')
        })
      })
    })
  })
}

function loginAndOpenTask() {
  cy.get('@user').then((user) => {
    cy.get('@task').then((task) => {
      cy.visit('/')

      cy.contains('div', 'Email Address')
        .find('input[type=text]')
        .type(user.email)

      cy.get('form')
        .submit()

      cy.get('h1')
        .should('contain.text', `Your tasks, ${user.firstName} ${user.lastName}`)

      cy.contains('.container-element', task.title)
        .find('img')
        .click()

      cy.get('.popup')
        .should('be.visible')

      cy.contains('.popup', task.title)
        .should('be.visible')
    })
  })
}

describe('Manipulating todo items of a task', () => {
  beforeEach(function () {
    createUserAndTask()
    loginAndOpenTask()
  })

  afterEach(function () {
    cy.get('@userId').then((userId) => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/users/${userId}`,
        failOnStatusCode: false
      })
    })
  })

  it('creates a new active todo item', () => {
    const description = `Read component docs ${Date.now()}`

    cy.get('.popup input[placeholder="Add a new todo item"]')
      .type(description)

    cy.get('.popup input[type=submit][value=Add]')
      .click()

    cy.contains('.popup .todo-item', description)
      .find('.checker')
      .should('have.class', 'unchecked')
  })

  it('keeps the add button disabled for an empty todo description', () => {
    cy.get('.popup input[placeholder="Add a new todo item"]')
      .should('have.value', '')

    cy.get('.popup input[type=submit][value=Add]')
      .should('be.disabled')
  })

  it('toggles an active todo item to done and back to active', () => {
    cy.get('@task').then((task) => {
      cy.contains('.popup .todo-item', task.todos)
        .find('.checker')
        .should('have.class', 'unchecked')
        .click()

      cy.contains('.popup .todo-item', task.todos)
        .find('.checker')
        .should('have.class', 'checked')
        .click()

      cy.contains('.popup .todo-item', task.todos)
        .find('.checker')
        .should('have.class', 'unchecked')
    })
  })

  it('deletes an existing todo item', () => {
    cy.get('@task').then((task) => {
      cy.contains('.popup .todo-item', task.todos)
        .find('.remover')
        .click()

      cy.contains('.popup .todo-item', task.todos)
        .should('not.exist')
    })
  })
})
