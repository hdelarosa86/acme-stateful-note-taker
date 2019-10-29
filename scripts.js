const { HashRouter, Switch, Link, Route, Redirect } = ReactRouterDOM;
const { render } = ReactDOM;
const root = document.querySelector('#root');


const Nav = () =>{
    return(
        <nav>
            <Link to="/notes">Notes</Link>
            <Link to="/archives">Archives</Link>
            <Link to="/create">Create</Link>
        </nav>
    )
}

const Notes = (props) => {
    console.log(props);
    const {notes, deleteNote} = props
    return(
        <ul id="note-container">
            {notes.map( (note,idx) => {
                return <li key={idx}>{note}
                <button>archive</button> 
                <button onClick={deleteNote}>destroy</button>
                </li>
            })}
        </ul>
    )
}
const Archives = () => {
    return (
        <div>
            Hello Archives
        </div>
    )
}
const Create = () => {
    return(
        <form>
            <input type='text' />
            <button> Create </button>
        </form>
    )
}

const API = 'https://acme-users-api-rev.herokuapp.com/api';

const fetchUser = async ()=> {
  const storage = window.localStorage;
  const userId = storage.getItem('userId'); 
  if(userId){
    try {
      return (await axios.get(`${API}/users/detail/${userId}`)).data;
    }
    catch(ex){
      storage.removeItem('userId');
      return fetchUser();
    }
  }
  const user = (await axios.get(`${API}/users/random`)).data;
  storage.setItem('userId', user.id);
  return  user;
};



class App extends React.Component{
    constructor(){
        super()
        this.state = {
            user : {},
            notes : ['no','yes','nah'],
            archives: [],
        }
    }
    componentDidMount(){
        const newUser = async ()=>{
            const user = await fetchUser();
            this.setState({user});
        };
       newUser();
    }

    deleteNote = (event)=>{
        const {notes} = this.state;
        const containerChildren = [...document.querySelector('#note-container').children];
        const index = containerChildren.indexOf(event.target.parentNode);
        this.setState({notes: notes.filter((currVal,idx) => {
            return idx !== index;
        })})

    }

    render(){
        const {user, notes} = this.state;
        return (
            <div>
                <h1>Acme Note--taker for {user.fullName}</h1>
                <HashRouter>
                    <Route render ={ () => <Nav/>} />
                    <Switch>
                        <Route path='/notes' render={ (props)=> <Notes {...props} notes={notes} deleteNote ={this.deleteNote}/>}  />
                        <Route path='/archives' component= { Archives } />
                        <Route path='/create' component= { Create } />
                        <Redirect to='/notes' />
                    </Switch>
                </HashRouter>
                
            </div>
        )
    }
}
render( <App />, root)