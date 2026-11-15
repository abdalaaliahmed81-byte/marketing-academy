import {cleanup,fireEvent,render,screen,within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {AcademyApp} from './App'
import {db} from './db'
import {lessons} from './lessons'

beforeEach(async()=>{await db.delete();await db.open();vi.spyOn(window,'scrollTo').mockImplementation(()=>{})})
afterEach(async()=>{cleanup();await db.delete();vi.restoreAllMocks()})
it('onboards, submits a quiz, saves practice, and opens a learned mission',async()=>{
  render(<MemoryRouter><AcademyApp/></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button',{name:'ابدأ التعلّم'}))
  fireEvent.click(await screen.findByRole('link',{name:'ابدأ الدرس الأول'}))
  fireEvent.click(await screen.findByRole('link',{name:'اذهب إلى الاختبار'}))
  for(const question of lessons[0].questions)fireEvent.click(screen.getByRole('radio',{name:question.options[0].label}))
  fireEvent.click(screen.getByRole('button',{name:'سلّم الاختبار'}))
  fireEvent.click(await screen.findByRole('link',{name:'اذهب إلى التطبيق'}))
  fireEvent.change(screen.getByRole('textbox',{name:'تطبيقك'}),{target:{value:'حجز للطلبة خلال الاستراحة'}})
  for(const check of within(screen.getByRole('group',{name:'المراجعة الذاتية'})).getAllByRole('checkbox'))fireEvent.click(check)
  fireEvent.click(screen.getByRole('button',{name:'أكمل الدرس'}))
  await screen.findByRole('link',{name:'الدرس التالي'})
  fireEvent.click(screen.getByRole('link',{name:'المهمة اليومية'}))
  await screen.findByText(lessons[0].mission)
},10000)
