document.addEventListener('DOMContentLoaded', () => {

  if (localStorage.getItem('myToken')) {

    // Create Chat Room
    let chat = document.querySelector('#chat')

    let ul = document.createElement('ul')
    ul.id = 'messages'

    let form = document.createElement('form')

    let input = document.createElement('input')
    input.id = 'message'
    input.placeholder = 'Your Message'

    let logout = document.createElement('button')
    logout.type = 'button'
    logout.id = 'logout'
    logout.innerHTML = 'Log Out'

    let ignore = document.createElement('button')
    ignore.type = 'button'
    ignore.id = 'ignoreList'
    ignore.innerHTML = 'Ignore List'

    form.appendChild(input)
    form.appendChild(logout)
    form.appendChild(ignore)
    chat.appendChild(ul)
    chat.appendChild(form)
    document.querySelector('#login').style.display = 'none'

    // Disconnect from Chat
    document.querySelector('#logout').addEventListener('click', () => {
      localStorage.removeItem('myToken')
      location.reload()
    })

    // Show Blacklisted Users
    document.querySelector('#ignoreList').addEventListener('click', () => {
      document.querySelector('#chat').style.display = 'none'
      document.querySelector('#blacklist').style.display = 'flex'
      let blacklistedUsers = JSON.parse(localStorage.getItem('blacklist'))
      let usersList = document.querySelector('#blacklistedUsers')

      for (let i = 0; i < blacklistedUsers.length; i++) {
        let li = document.createElement('li')
        li.setAttribute('user', blacklistedUsers[i])

        let user = document.createElement('span')
        user.innerHTML = blacklistedUsers[i]

        let removeBtn = document.createElement('button')
        removeBtn.class = 'remBlacklist'
        removeBtn.innerHTML = '&#x78;'

        li.appendChild(user)
        li.appendChild(removeBtn)
        usersList.appendChild(li)

        removeBtn.addEventListener('click', () => {
          let username = removeBtn.parentElement.getAttribute('user')
          remBlacklist(username)
          usersList.innerHTML = ''
          location.reload()
        })
      }

      // Close Blacklist
      document.querySelector('#closeBlacklist').addEventListener('click', () => {
        document.querySelector('#chat').style.display = 'flex'
        usersList.innerHTML = ''
        document.querySelector('#blacklist').style.display = 'none'
      })
    })

    // Display Messages
    localStorage.setItem('lastMessageID', -1)

    setInterval(() => {
      let lastMessageId = localStorage.getItem('lastMessageID')

      fetch('http://edu2.shareyourtime.fr/apijsv2/messages', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('myToken')
        }
      }).then((resp) => {
        resp.json().then((json) => {
          let data = json['data']

          if (lastMessageId == -1) {
            for (let i = data.length - 1; i >= 0; i--) {
              createMessage(data, i)
            }
          } else if (data[0]['id'] != lastMessageId) {
            for (let j = data.length - 1; j >= 0; j--) {
              const element = data[j]['id']

              if (element == lastMessageId) {
                for (let i = j - 1; i >= 0; i--) {
                  createMessage(data, i)
                }

                break
              }
            }
          }
        })
      }).catch((errors) => {
        console.error(errors)
      })
    }, 1000)

    // Send Message
    document.querySelector('#message').addEventListener('keydown', (e) => {
      let message = document.querySelector('#message')

      if (e.keyCode === 13 && message.value.length >= 8) {

        fetch('http://edu2.shareyourtime.fr/apijsv2/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + localStorage.getItem('myToken')
          },
          body: 'message=' + message.value
        })
        message.value = ''
        e.preventDefault()
      }
    })
  }

  // Get Token to send messages
  document.querySelector('#enter').addEventListener('click', () => {
    let email = document.querySelector('#email')
    let pwd = document.querySelector('#pwd')

    fetch('http://edu2.shareyourtime.fr/apijsv2/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'email=' + email.value + '&password=' + pwd.value
    }).then((resp) => {
      resp.json().then((json) => {
        localStorage.setItem('myToken', json['data']['token'])
        location.reload()
      })
    })
  })
})


// Create Message 
function createMessage(data, i) {
  let ul = document.querySelector('#messages')
  let id = data[i]['id']
  let nickname = document.createElement('span')
  nickname.innerHTML = escapeHtml(data[i]['nickname'])
  nickname.style.fontSize = '20px'

  if (JSON.parse(localStorage.getItem('blacklist')).includes(data[i]['nickname'])) {
    return
  }

  if (localStorage.getItem(data[i]['nickname'])) {
    nickname.style.color = localStorage.getItem(data[i]['nickname'])
  } else {
    nickname.style.color = '#' + Math.floor(Math.random() * 16777215).toString(16)
    localStorage.setItem(data[i]['nickname'], nickname.style.color)
  }

  let creationTime = document.createElement('span')
  let options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: 'true'
  }
  let time = new Date(data[i]['created_at'])
  creationTime.innerHTML = time.toLocaleDateString('en-GB', options)
  creationTime.style.fontSize = '9px'
  creationTime.style.color = '#c0c0c0'

  let message = document.createElement('span')
  message.innerHTML = escapeHtml(data[i]['message'])
  message.style.marginTop = '10px'

  let ignoreBtn = document.createElement('button')
  ignoreBtn.class = 'addBlacklist'
  ignoreBtn.innerHTML = '&#x78; Ignore ' + data[i]['nickname']

  let li = document.createElement('li')
  li.setAttribute('user', data[i]['nickname'])

  li.appendChild(nickname)
  li.appendChild(creationTime)
  li.appendChild(message)
  li.appendChild(ignoreBtn)
  ul.appendChild(li)

  ignoreBtn.addEventListener('click', () => {
    let username = ignoreBtn.parentElement.getAttribute('user')
    addBlacklist(username)
    location.reload()
  })

  localStorage.setItem('lastMessageID', id)
  ul.scrollTop = ul.scrollHeight
}

// Protect from bad people
function escapeHtml(text) {
  let map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#039;'
  }

  return text.replace(/[&<>"']/g, (m) => {
    return map[m]
  })
}

// Add User to Blacklist
function addBlacklist(name) {
  if (localStorage.getItem('blacklist')) {
    blacklist = JSON.parse(localStorage.getItem('blacklist'))
  } else {
    blacklist = []
  }

  if (!blacklist.includes(name)) {
    blacklist.push(name)
    localStorage.setItem('blacklist', JSON.stringify(blacklist))
  } else {
    return
  }
}

// Remove User from Blacklist
function remBlacklist(name) {
  if (localStorage.getItem('blacklist')) {
    blacklist = JSON.parse(localStorage.getItem('blacklist'))
  } else {
    return
  }

  for (let i = 0; i < blacklist.length; i++) {
    const element = blacklist[i];
    if (element == name) {
      blacklist.splice(i, i + 1)
      localStorage.setItem('blacklist', JSON.stringify(blacklist))
      return
    }
  }
}