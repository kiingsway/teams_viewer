type THandleAlerts = (msg: any, type?: 'default' | 'info' | 'success' | 'warning' | 'error', timeMs?: number) => void;

export interface IMe {
  "@odata.context": string
  businessPhones: any[];
  displayName: string
  givenName: string
  jobTitle: string
  mail: string
  mobilePhone: any
  officeLocation: any
  preferredLanguage: string
  surname: string
  userPrincipalName: string
  id: string
}

export interface IChat {
  id: string
  topic?: string
  createdDateTime: string
  lastUpdatedDateTime: string
  chatType: string
  webUrl: string
  tenantId: string
  onlineMeetingInfo?: {
    calendarEventId?: string
    joinWebUrl?: string
    organizer: {
      id: string
      displayName: any
      userIdentityType: string
    }
  }
  viewpoint: {
    isHidden: boolean
    lastMessageReadDateTime: string
  }
  "members@odata.context": string
  members: {
    "@odata.type": string
    id: string
    roles: Array<string>
    displayName: string
    visibleHistoryStartDateTime: string
    userId: string
    email: string
    tenantId: string
  }[]
}

export interface IMessage {
  id: string
  replyToId: any
  etag: string
  messageType: string
  createdDateTime: string
  lastModifiedDateTime: string
  lastEditedDateTime: any
  deletedDateTime?: string
  subject: any
  summary: any
  chatId: string
  importance: string
  locale: string
  webUrl: any
  channelIdentity: any
  onBehalfOf: any
  policyViolation: any
  eventDetail: any
  from: {
    application: any
    device: any
    user: {
      id: string
      displayName: string
      userIdentityType: string
      tenantId: string
    }
  }
  body: {
    contentType: string
    content: string
  }
  attachments: Array<{
    id: string
    contentType: string
    contentUrl: string
    content: any
    name: string
    thumbnailUrl: any
    teamsAppId: any
  }>
  mentions: Array<any>
  reactions: IReaction[]
}

export interface IReaction {
  reactionType: string
  createdDateTime: string
  user: {
    application: any
    device: any
    user: {
      id: string
      displayName: any
      userIdentityType: string
    }
  }
}

export interface IConversations {
  token: string;
  me: IMe;
  handleLogout: () => void;
}

export interface ILoadingTeamsApp {
  chats: boolean;
  moreChats: boolean;
  chatMessages: boolean;
}

export interface IChatMessages {
  chat: IChat;
  messages: IMessage[];
  nextLink: string;
}


export interface IChatsState {
  items?: IChat[];
  nextLink: string;
}

export interface IToken {
  text: string;
  jwt: IJwt | null;
}

export interface IJwt {
  expires: string;
  given_name: string;
  name: string;
  email: string;
}