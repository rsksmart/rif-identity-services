import {
  DriverLicenseRequest,
  DriverLicense,
  dlCredentialRequesToSelectiveDisclosureRequest,
  dlCredentialRequesFromSelectiveDisclosureRequest,
  dlCredentialRequestDiscriminator
} from './driverLicense'
import { SelectiveDisclosureRequest } from 'daf-selective-disclosure'

export type CredentialRequest = DriverLicenseRequest
export type Credential = DriverLicense

export const credentialRequesToSelectiveDisclosureRequest = (credentialRequest: CredentialRequest) => {
  switch (credentialRequest.type) {
    case dlCredentialRequestDiscriminator: return dlCredentialRequesToSelectiveDisclosureRequest(credentialRequest)
    default: throw new Error('Credential type not implemented')
  }
}

export const credentialRequesFromSelectiveDisclosureRequest = (credentialRequest: SelectiveDisclosureRequest) => {
  try {
    return dlCredentialRequesFromSelectiveDisclosureRequest(credentialRequest)
  } catch (e) {}
  throw new Error('Credential type not implemented')
}
