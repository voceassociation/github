"""Teaching model for chapter 4; not a deployed authorization service."""
from dataclasses import dataclass

@dataclass(frozen=True)
class Invoice:
    tenant: str
    local_id: str
    folder: str
    classification: str = 'ordinary'

@dataclass(frozen=True)
class Context:
    active_tenant: str
    memberships: frozenset
    roles: frozenset  # (tenant, role)
    audits: frozenset  # (tenant, folder)
    clearances: frozenset  # tenants with restricted clearance


def can_read(ctx, invoice):
    if ctx.active_tenant != invoice.tenant or invoice.tenant not in ctx.memberships:
        return False
    if invoice.classification not in {'ordinary', 'restricted'}:
        return False
    granted = ((invoice.tenant, 'invoice_reader') in ctx.roles or
               (invoice.tenant, invoice.folder) in ctx.audits)
    return granted and (invoice.classification == 'ordinary' or
                        invoice.tenant in ctx.clearances)


def resolve(invoices, tenant, local_id):
    return invoices[(tenant, local_id)]


def visible_page(ctx, ranked, limit):
    if limit < 0:
        raise ValueError('Negative page size')
    return [obj for obj in ranked if can_read(ctx, obj)][:limit]
