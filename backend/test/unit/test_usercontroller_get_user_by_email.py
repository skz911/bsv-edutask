import pytest
from unittest.mock import MagicMock

from src.controllers.usercontroller import UserController


@pytest.fixture
def mocked_dao():
    return MagicMock()


@pytest.fixture
def sut(mocked_dao):
    return UserController(dao=mocked_dao)


@pytest.mark.unit
def test_get_user_by_email_returns_user_for_single_match(sut, mocked_dao):
    user = {'firstName': 'Jane', 'lastName': 'Doe', 'email': 'jane.doe@example.com'}
    mocked_dao.find.return_value = [user]

    result = sut.get_user_by_email('jane.doe@example.com')

    assert result == user


@pytest.mark.unit
def test_get_user_by_email_returns_first_user_and_warns_for_multiple_matches(sut, mocked_dao, capsys):
    email = 'jane.doe@example.com'
    users = [
        {'firstName': 'Jane', 'lastName': 'Doe', 'email': email},
        {'firstName': 'Janet', 'lastName': 'Doe', 'email': email}
    ]
    mocked_dao.find.return_value = users

    result = sut.get_user_by_email(email)

    assert result == users[0]
    output = capsys.readouterr().out
    assert 'more than one user found' in output and email in output


@pytest.mark.unit
def test_get_user_by_email_returns_none_for_unknown_email(sut, mocked_dao):
    mocked_dao.find.return_value = []

    assert sut.get_user_by_email('nobody@example.com') is None


@pytest.mark.unit
@pytest.mark.parametrize('invalid_email', [
    'jane.doe.example.com',
    'jane@doe'
])
def test_get_user_by_email_rejects_invalid_email_addresses(sut, invalid_email):
    with pytest.raises(ValueError):
        sut.get_user_by_email(invalid_email)


@pytest.mark.unit
def test_get_user_by_email_propagates_dao_errors(sut, mocked_dao):
    mocked_dao.find.side_effect = Exception('database unavailable')

    with pytest.raises(Exception, match='database unavailable'):
        sut.get_user_by_email('jane.doe@example.com')
