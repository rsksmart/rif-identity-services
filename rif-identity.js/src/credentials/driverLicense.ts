import { SelectiveDisclosureRequest } from 'daf-selective-disclosure'
import { DID } from './identity'

export const dlCredentialRequestDiscriminator = 'DLCredentialRequestDiscriminator'
export type DLCredentialRequestDiscriminator = 'DLCredentialRequestDiscriminator'

export interface DriverLicenseRequest {
  type: DLCredentialRequestDiscriminator
  subject: DID
  issuer: DID
  fullName: string
  city: string
}

enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK',
  SCHOOL_BUS = 'SCHOOL_BUS',
  LONG_DISTANCE_BUS = 'LONG_DISTANCE_BUS'
}

enum LicenceType {
  A1 = 'A1',
  A2 = 'A2',
  A3 = 'A3',
  B1 = 'B1',
  C1 = 'C1'
}

export const dlCredentialDiscriminators = 'DLCredentialDiscriminators'
export type DLCredentialDiscriminators = 'DLCredentialDiscriminators'

export interface DriverLicense {
  type: DLCredentialDiscriminators
  subject: DID
  issuer: DID
  fullName: string
  city: string
  expiration: Date
  vehicleType: VehicleType
  licenceType: LicenceType
  international: Boolean
  issuanceOffice: string
  id: number
}

enum ClaimType {
  FULL_NAME = 'fullName',
  CITY = 'city'
}

export const dlCredentialRequesToSelectiveDisclosureRequest = (credentialRequest: DriverLicenseRequest) => ({
  issuer: credentialRequest.subject,
  claims: [
    { claimType: ClaimType.FULL_NAME, claimValue: credentialRequest.fullName },
    { claimType: ClaimType.CITY, claimValue: credentialRequest.city }
  ]
} as SelectiveDisclosureRequest)

export const dlCredentialRequesFromSelectiveDisclosureRequest = (selectiveDisclosure: SelectiveDisclosureRequest) => (Object.assign({
  subject: selectiveDisclosure.issuer
}, ...selectiveDisclosure.claims.map(claim => {
  switch (claim.claimType) {
    case ClaimType.FULL_NAME:
      return { fullName: claim.claimValue }
    case ClaimType.CITY:
      return { city: claim.claimValue }
    default: throw new TypeError('Invalid selective disclosure request.')
  }
})) as DriverLicenseRequest)
