/* eslint-disable react/no-multi-comp */
/* eslint-disable react/react-in-jsx-scope */
const { HashRouter, Switch, Link, Route, Redirect } = ReactRouterDOM;
const { render } = ReactDOM;
const root = document.querySelector('#root');

const API = 'https://acme-users-api-rev.herokuapp.com/api';

const fetchUser = async () => {
  const storage = window.localStorage;
  const userId = storage.getItem('userId');
  if (userId) {
    try {
      return (await axios.get(`${API}/users/detail/${userId}`)).data;
    } catch (ex) {
      storage.removeItem('userId');
      return fetchUser();
    }
  }
  const user = (await axios.get(`${API}/users/random`)).data;
  storage.setItem('userId', user.id);
  return user;
};

const Nav = ({ notes, pathname }) => {
  return (
    <nav>
      <Link
        to="/notes"
        className={pathname === '/notes' ? 'active' : ''}
      >{`Notes (${
        notes.filter((note) => note.archived === false).length
      })`}</Link>
      <Link
        to="/archives"
        className={pathname === '/archives' ? 'active' : ''}
      >{`Archives (${
        notes.filter((note) => note.archived === true).length
      })`}</Link>
      <Link to="/create" className={pathname === '/create' ? 'active' : ''}>
        Create
      </Link>
    </nav>
  );
};

const Notes = ({ notes, archived, editNote, deleteNote }) => {
  const _notes = notes.filter((note) => note.archived === archived);
  return (
    <div>
      <ul>
        {_notes.map((note, idx) => {
          return (
            <li key={idx} className="note">
              <p>{note.text}</p>
              <button type="button" onClick={() => deleteNote(note)}>
                Delete Note
              </button>
              <button type="button" onClick={() => editNote(note)}>
                {note.archived ? 'Unarchive' : 'Archive'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

class Create extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: '',
      text: '',
    };
  }

  render() {
    const createNote = async () => {
      this.props
        .create({ archived: false, text: this.state.text })
        .then(() => this.props.history.push('/notes'))
        .catch((err) => this.setState({ error: err.response.data.message }));
    };
    return (
      <form onSubmit={(ev) => ev.preventDefault()}>
        <input
          value={this.state.text}
          placeholder="create a note"
          name="text"
          type="text"
          onChange={(ev) => this.setState({ text: ev.target.value })}
        />
        <button type="button" onClick={createNote}>
          {' '}
          Create{' '}
        </button>
        {!!this.state.error && <div>{this.state.error}</div>}
      </form>
    );
  }
}
class App extends React.Component {
  constructor() {
    super();
    this.state = {
      user: {},
      notes: [],
    };
  }
  componentDidMount() {
    const newUser = async () => {
      const user = await fetchUser();
      const notes = (await axios.get(`${API}/users/${user.id}/notes`)).data;
      this.setState({ user, notes });
    };
    newUser();
  }

  render() {
    const { user, notes } = this.state;

    const destroy = (note) => {
      const prevStateNotes = notes;
      axios.delete(`${API}/users/${user.id}/notes/${note.id}`).then(() => {
        this.setState({
          notes: prevStateNotes.filter((_note) => _note.id !== note.id),
        });
      });
    };

    const edit = async (note) => {
      const response = (
        await axios.put(`${API}/users/${user.id}/notes/${note.id}`, {
          archived: !note.archived,
        })
      ).data;
      const notes = this.state.notes.map((_note) =>
        _note.id === note.id ? response : _note
      );
      this.setState({ notes });
    };

    const create = async (payload) => {
      const response = (
        await axios.post(`${API}/users/${user.id}/notes`, payload)
      ).data;
      const notes = [...this.state.notes, response];
      this.setState({ notes });
    };
    return (
      <div>
        <h1>Acme Note--taker for {user.fullName}</h1>
        <HashRouter>
          <Route
            render={({ location }) => (
              <Nav notes={notes} pathname={location.pathname} />
            )}
          />
          <Switch>
            <Route
              path="/notes"
              render={() => (
                <Notes
                  notes={notes}
                  archived={false}
                  editNote={edit}
                  deleteNote={destroy}
                />
              )}
            />
            <Route
              path="/archives"
              render={() => (
                <Notes
                  notes={notes}
                  archived={true}
                  editNote={edit}
                  deleteNote={destroy}
                />
              )}
            />
            <Route
              path="/create"
              render={(props) => (
                <Create {...props} create={create} user={user} />
              )}
            />
            <Redirect to="/notes" />
          </Switch>
        </HashRouter>
      </div>
    );
  }
}
render(<App />, root);
