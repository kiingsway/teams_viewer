export type IReactionType = "like" | "heart" | "laugh" | "surprised" | "sad" | "angry"

export interface IMe {
  businessPhones: any[]
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
  getNextMessages: string;
  id: string
  topic: string
  createdDateTime: string
  lastUpdatedDateTime: string
  chatType: string
  webUrl: string
  tenantId: string
  onlineMeetingInfo: any
  viewpoint: {
    isHidden: boolean
    lastMessageReadDateTime: string
  }
  members: {
    "@odata.type": string
    id: string
    roles: string[]
    displayName: string
    visibleHistoryStartDateTime: string
    userId: string
    email: string
    tenantId: string
  }[]
  messages: {
    id: string
    replyToId: any
    etag: string
    messageType: string
    createdDateTime: string
    lastModifiedDateTime: string
    lastEditedDateTime: any
    deletedDateTime: any
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
      user: User
    }
    body: {
      contentType: string
      content: string
    }
    attachments: Attachment[]
    mentions: Mention[]
    reactions: {
      reactionType: IReactionType
      createdDateTime: string
      user: {
        application: any
        device: any
        user: User
      }
    }[]
  }[]
}

interface User {
  id: string
  displayName: string
  userIdentityType: string
  tenantId?: string
}

interface Attachment {
  id: string
  contentType: string
  contentUrl: any
  content: string
  name: any
  thumbnailUrl: any
  teamsAppId?: string
}

interface Mention {
  id: number
  mentionText: string
  mentioned: {
    application: any
    device: any
    conversation: any
    tag: any
    user: User
  }
}