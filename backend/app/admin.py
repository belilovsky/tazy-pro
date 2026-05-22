"""SQLAdmin setup for TAZY.PRO."""

from __future__ import annotations

from sqladmin import Admin, ModelView

from backend.app.config import Settings
from backend.app.models import Breeder, Dog, EvidenceItem, ExportPackage, Kennel, Owner, PassportEvent, VerificationDecision
from backend.app.security import TazyAdminAuth


class TazyModelView(ModelView):
    form_excluded_columns = ("created_at", "updated_at")
    page_size = 25


class DogAdmin(TazyModelView, model=Dog):
    name = "Тазы"
    name_plural = "Реестр тазы"
    column_list = [Dog.name, Dog.registry_number, Dog.passport_id, Dog.region, Dog.verification_level, Dog.completeness_score, Dog.status]
    column_searchable_list = [Dog.name, Dog.registry_number, Dog.passport_id, Dog.public_id]
    column_sortable_list = [Dog.name, Dog.verification_level, Dog.completeness_score, Dog.created_at]
    form_excluded_columns = (*TazyModelView.form_excluded_columns, "evidence_items", "passport_events")
    column_labels = {
        "name": "Кличка",
        "public_id": "Публичный ID",
        "registry_number": "Номер реестра",
        "passport_id": "Паспорт",
        "sex": "Пол",
        "region": "Регион",
        "status": "Статус",
        "verification_level": "Уровень",
        "completeness_score": "Готовность, %",
        "breeder": "Заводчик",
        "kennel": "Питомник",
        "summary": "Публичное описание",
    }


class EvidenceAdmin(TazyModelView, model=EvidenceItem):
    name = "Доказательство"
    name_plural = "Доказательства"
    column_list = [EvidenceItem.title, EvidenceItem.dog, EvidenceItem.type, EvidenceItem.priority, EvidenceItem.status, EvidenceItem.visibility]
    column_searchable_list = [EvidenceItem.title, EvidenceItem.public_id, EvidenceItem.submitted_by]
    column_sortable_list = [EvidenceItem.priority, EvidenceItem.status, EvidenceItem.received_at]
    form_excluded_columns = (*TazyModelView.form_excluded_columns, "decisions")
    column_labels = {
        "public_id": "Публичный ID",
        "dog": "Тазы",
        "type": "Тип",
        "label": "Метка",
        "title": "Название",
        "submitted_by": "Кем подано",
        "received_at": "Получено",
        "priority": "Приоритет",
        "status": "Статус",
        "visibility": "Видимость",
        "summary": "Краткое описание",
        "reviewer_note": "Заметка ревьюера",
    }


class DecisionAdmin(TazyModelView, model=VerificationDecision):
    name = "Решение"
    name_plural = "Решения ревьюеров"
    column_list = [VerificationDecision.public_id, VerificationDecision.evidence_item, VerificationDecision.decision, VerificationDecision.reviewer_id, VerificationDecision.created_at]
    column_searchable_list = [VerificationDecision.public_id, VerificationDecision.reviewer_id, VerificationDecision.note]
    column_sortable_list = [VerificationDecision.created_at, VerificationDecision.decision]
    column_labels = {
        "public_id": "Публичный ID",
        "evidence_item": "Доказательство",
        "reviewer_id": "Ревьюер",
        "decision": "Решение",
        "note": "Комментарий",
        "created_at": "Создано",
    }


class PassportEventAdmin(TazyModelView, model=PassportEvent):
    name = "Событие паспорта"
    name_plural = "События паспорта"
    column_list = [PassportEvent.title, PassportEvent.dog, PassportEvent.value, PassportEvent.event_at, PassportEvent.visibility]
    column_searchable_list = [PassportEvent.title, PassportEvent.value, PassportEvent.public_id]
    column_sortable_list = [PassportEvent.event_at]


class BreederAdmin(TazyModelView, model=Breeder):
    name = "Заводчик"
    name_plural = "Заводчики"
    column_list = [Breeder.display_name, Breeder.region, Breeder.verification_status]
    column_searchable_list = [Breeder.display_name, Breeder.legal_name, Breeder.region]


class KennelAdmin(TazyModelView, model=Kennel):
    name = "Питомник"
    name_plural = "Питомники"
    column_list = [Kennel.name, Kennel.registration_number, Kennel.region, Kennel.verification_status]
    column_searchable_list = [Kennel.name, Kennel.registration_number, Kennel.region]


class OwnerAdmin(TazyModelView, model=Owner):
    name = "Владелец"
    name_plural = "Владельцы"
    column_list = [Owner.display_name, Owner.country, Owner.region, Owner.public_contact_allowed]
    column_searchable_list = [Owner.display_name, Owner.legal_name, Owner.contact_email]


class ExportPackageAdmin(TazyModelView, model=ExportPackage):
    name = "FCI пакет"
    name_plural = "FCI пакеты"
    column_list = [ExportPackage.name, ExportPackage.format, ExportPackage.status, ExportPackage.created_at]
    column_searchable_list = [ExportPackage.name, ExportPackage.package_key]
    column_sortable_list = [ExportPackage.created_at, ExportPackage.status]


def init_admin(app, engine, settings: Settings) -> None:
    auth = TazyAdminAuth(
        settings.secret_key,
        username=settings.admin_username,
        password=settings.admin_password,
    )
    admin = Admin(app, engine, authentication_backend=auth, title="TAZY.PRO Admin")
    for view in (DogAdmin, EvidenceAdmin, DecisionAdmin, PassportEventAdmin, BreederAdmin, KennelAdmin, OwnerAdmin, ExportPackageAdmin):
        admin.add_view(view)
