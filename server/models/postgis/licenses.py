from server.models.dtos.licenses_dto import LicenseDTO
from server import db

# Secondary table defining the many-to-many join
users_licenses_table = db.Table(
    'users_licenses', db.metadata,
    db.Column('user', db.BigInteger, db.ForeignKey('users.id')),
    db.Column('license', db.Integer, db.ForeignKey('licenses.id')))


class License(db.Model):
    """ Describes an individual license"""
    __tablename__ = "licenses"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True)
    description = db.Column(db.String)
    plain_text = db.Column(db.String)

    projects = db.relationship("Project", backref='license')
    users = db.relationship("License", secondary=users_licenses_table)  # Many to Many relationship

    @classmethod
    def create_from_dto(cls, dto: LicenseDTO):
        """ Creates a new License class from dto """
        new_license = cls()
        new_license.name = dto.name
        new_license.description = dto.description
        new_license.plain_text = dto.plain_text

        db.session.add(new_license)
        db.session.commit()
