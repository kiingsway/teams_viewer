import axios from 'axios'

const hostGraph = "https://graph.microsoft.com"

export function GetMyInfo(token: string) {

  return axios({
    method: 'GET',
    url: `${hostGraph}/v1.0/me`,
    headers: { Authorization: token }
  })
}

export function GetChats(token: string) {

  return axios({
    method: 'GET',
    url: `${hostGraph}/beta/chats?$top=50&$expand=members`,
    headers: { Authorization: token }
  })
}

export function GetChatMessages(id: string, token: string) {

  return axios({
    method: 'GET',
    url: `${hostGraph}/beta/chats/${id}/messages?$top=50`,
    headers: { Authorization: token }
  });
}

export function GetChatMessage(chatId: string, msgId: string, token: string) {

  return axios({
    method: 'GET',
    url: `${hostGraph}/beta/chats/${chatId}/messages/${msgId}`,
    headers: { Authorization: token }
  });
}

export function ReactMessage(chatId: string, msgId: string, reactionType: string, token: string) {

  return axios({
    url: `${hostGraph}/beta/chats/${chatId}/messages/${msgId}/setReaction`,
    method: 'POST',
    data: {reactionType},
    headers: { Authorization: token }
  })
}

export function GetViaUrl(url: string, token: string) {

  return axios({
    method: 'GET',
    url,
    headers: { Authorization: token }
  })
}

export function GetUserById(userId: string, token: string) {

  return axios({
    method: 'GET',
    url: `${hostGraph}/users/${userId}`,
    headers: { Authorization: token }
  })
}