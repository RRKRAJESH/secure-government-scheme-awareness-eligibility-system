from pydantic import BaseModel, Field
from typing import Annotated, Any, List, Optional
from enum import Enum


class AppBaseModel(BaseModel):
    class Config:
        extra = "allow"


# ===== ENUMS =====
class SchemeType(str, Enum):
    STANDALONE = "STANDALONE"
    UMBRELLA = "UMBRELLA"
    COMPONENT = "COMPONENT"

class AgricultureSector(str, Enum):
    AGRICULTURE = "AGRICULTURE"
    DAIRY = "DAIRY"
    POULTRY = "POULTRY"
    FISHERIES = "FISHERIES"
    HORTICULTURE = "HORTICULTURE"

class GovernmentLevel(str, Enum):
    CENTRAL = "CENTRAL"
    STATE = "STATE"
    BOTH = "BOTH"


class SchemeStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    UPCOMING = "UPCOMING"
    CLOSED = "CLOSED"


class BenefitType(str, Enum):
    CASH_TRANSFER = "CASH_TRANSFER"
    SUBSIDY = "SUBSIDY"
    LOAN = "LOAN"
    INSURANCE = "INSURANCE"
    TRAINING = "TRAINING"
    EQUIPMENT = "EQUIPMENT"
    MIXED = "MIXED"
    SERVICE = "SERVICE"
    PENSION = "PENSION"
    PRICE_SUPPORT = "PRICE_SUPPORT"
    INFRASTRUCTURE_SUPPORT = "INFRASTRUCTURE_SUPPORT"
    SERVICE_SUPPORT = "SERVICE_SUPPORT"
    NA = "NA"


class ApplicationMode(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    BOTH = "BOTH"
    NA = "NA"


class PaymentMode(str, Enum):
    DBT = "DBT"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE = "CHEQUE"
    NA = "NA"


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    ANY = "ANY"


class LandUnit(str, Enum):
    HECTARE = "HECTARE"
    ACRE = "ACRE"


# ===== NESTED MODELS =====
class Ministry(BaseModel):
    name: str
    officialWebsite: Optional[str] = None


class Description(BaseModel):
    short: Optional[str] = None
    detailed: Optional[str] = None


class LandHolding(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None
    unit: Optional[LandUnit] = LandUnit.HECTARE


# -- Old eligibility model (kept for backwards compat) --
class Eligibility(BaseModel):
    minAge: Optional[int] = None
    maxAge: Optional[int] = None
    incomeLimit: Optional[float] = None
    landHolding: Optional[LandHolding] = None
    casteCategory: Optional[List[str]] = None
    gender: Optional[Gender] = Gender.ANY
    statesAllowed: Optional[List[str]] = []
    requiredDocuments: Optional[List[str]] = []


# -- New EligibilityV2 models --
class RuleCondition(BaseModel):
    path: Optional[str] = None
    op: Optional[str] = None
    value: Optional[Any] = None

class RuleLogic(BaseModel):
    all: Optional[List[RuleCondition]] = []

class InclusionRule(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    logic: Optional[RuleLogic] = None

class ExclusionRule(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    logic: Optional[RuleLogic] = None

class RequiredDocument(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    mandatory: Optional[bool] = True

class ResultRef(BaseModel):
    ref: Optional[str] = None

class ResultEligibleIf(BaseModel):
    all: Optional[List[ResultRef]] = []

class ResultComputation(BaseModel):
    eligibleIf: Optional[ResultEligibleIf] = None

class EligibilityV2(BaseModel):
    type: Optional[str] = None
    inclusionRules: Optional[List[InclusionRule]] = []
    exclusionRules: Optional[List[ExclusionRule]] = []
    requiredDocuments: Optional[List[RequiredDocument]] = []
    operationalChecks: Optional[List[Any]] = []
    resultComputation: Optional[ResultComputation] = None


class FinancialBenefit(BaseModel):
    totalAmount: Optional[float] = None
    currency: str = "INR"
    installmentCount: Optional[int] = None
    installmentAmount: Optional[float] = None


class DisbursementSchedule(BaseModel):
    period: str
    amount: float


class Benefits(BaseModel):
    benefitType: Optional[str] = None
    financial: Optional[FinancialBenefit] = None
    disbursementSchedule: Optional[List[DisbursementSchedule]] = []
    paymentMode: Optional[str] = None
    frequency: Optional[str] = None


class ApplicationDetails(BaseModel):
    mode: Optional[str] = None
    officialWebsite: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None


# ===== SCHEME RESPONSE MODELS =====
class SchemeListItem(BaseModel):
    """Lightweight scheme for list view"""
    id: str = Field(alias="_id")
    schemeName: str
    schemeCode: str
    schemeType: Optional[str] = None
    sector: Optional[str] = None
    governmentLevel: Optional[str] = None
    description: Optional[Description] = None
    status: Optional[str] = None
    directUse: bool = True
    benefitType: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    department: Optional[str] = None
    createdAt: Optional[str] = None

    class Config:
        populate_by_name = True


class SchemeDetail(BaseModel):
    """Full scheme details"""
    id: str = Field(alias="_id")
    schemeName: str
    schemeCode: str
    schemeType: Optional[str] = None
    directUse: bool = True
    parentSchemeId: Optional[str] = None
    sector: Optional[str] = None
    governmentLevel: Optional[str] = None
    launchDate: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    ministry: Optional[Ministry] = None
    department: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    description: Optional[Description] = None
    eligibility: Optional[Eligibility] = None
    eligibilityV2: Optional[EligibilityV2] = None
    benefits: Optional[Benefits] = None
    applicationDetails: Optional[ApplicationDetails] = None
    status: Optional[str] = None

    class Config:
        populate_by_name = True


class SubSchemeItem(BaseModel):
    """Sub-scheme under umbrella"""
    id: str = Field(alias="_id")
    schemeName: str
    schemeCode: str
    description: Optional[Description] = None
    status: SchemeStatus

    class Config:
        populate_by_name = True


# ===== REQUEST MODELS =====
class SchemeSearchFilters(BaseModel):
    """Search filters for schemes"""
    keyword: Optional[str] = None
    sector: Optional[AgricultureSector] = None
    governmentLevel: Optional[GovernmentLevel] = None
    schemeType: Optional[SchemeType] = None
    status: Optional[SchemeStatus] = SchemeStatus.ACTIVE
    minAge: Optional[int] = None
    maxAge: Optional[int] = None
    landHolding: Optional[float] = None
    incomeLimit: Optional[float] = None
    casteCategory: Optional[str] = None
    state: Optional[str] = None
    page: int = 1
    limit: int = 10


# ===== RESPONSE MODELS =====
class PaginationInfo(BaseModel):
    currentPage: int
    totalPages: int
    totalCount: int
    hasNext: bool
    hasPrevious: bool


class SchemeListResponseData(BaseModel):
    schemes: List[SchemeListItem]
    pagination: PaginationInfo


class SchemeListResponse(BaseModel):
    error: bool = False
    data: SchemeListResponseData


class SchemeDetailResponseData(BaseModel):
    scheme: SchemeDetail
    subSchemes: Optional[List[SubSchemeItem]] = []


class SchemeDetailResponse(BaseModel):
    error: bool = False
    data: SchemeDetailResponseData


class SchemeSearchResponseData(BaseModel):
    schemes: List[SchemeListItem]
    pagination: PaginationInfo
    appliedFilters: dict


class SchemeSearchResponse(BaseModel):
    error: bool = False
    data: SchemeSearchResponseData
