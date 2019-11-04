import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });

let context = require.context('../src', true, /\.test\.js$/);
context.keys().forEach(context);
