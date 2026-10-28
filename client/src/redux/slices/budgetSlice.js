import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as budgetService from '../../services/budgetService'

const getError = (error) => error.response?.data?.message || error.message || 'Something went wrong'

export const fetchBudget = createAsyncThunk('budget/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await budgetService.getBudget()
    return response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

export const saveBudget = createAsyncThunk('budget/save', async (data, { rejectWithValue, dispatch }) => {
  try {
    const response = await budgetService.setBudget(data)
    dispatch(fetchBudget())
    return response.data.data
  } catch (error) {
    return rejectWithValue(getError(error))
  }
})

const initialState = {
  monthlyBudget: 0,
  dailyBudget: 0,
  dailyAlertTime: '20:00',
  todaySpent: 0,
  todayRemaining: 0,
  todaySaved: 0,
  isOverspentToday: false,
  daysInMonth: 30,
  categories: [],
  remaining: 0,
  loading: false,
  error: ''
}

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    setBudget: (state, action) => {
      state.monthlyBudget = action.payload.monthlyBudget
      state.dailyBudget = action.payload.dailyBudget || 0
      state.dailyAlertTime = action.payload.dailyAlertTime || '20:00'
      state.todaySpent = action.payload.todaySpent || 0
      state.todayRemaining = action.payload.todayRemaining || 0
      state.todaySaved = action.payload.todaySaved || 0
      state.isOverspentToday = !!action.payload.isOverspentToday
      state.daysInMonth = action.payload.daysInMonth || 30
      state.categories = action.payload.categoryBudgets || []
      state.remaining = action.payload.monthlyBudget
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    updateRemaining: (state, action) => {
      state.remaining = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudget.pending, (state) => {
        state.loading = true
        state.error = ''
      })
      .addCase(fetchBudget.fulfilled, (state, action) => {
        state.loading = false
        if (typeof window !== 'undefined' && action.payload) {
          try { localStorage.setItem('xpenz_cached_budget', JSON.stringify(action.payload)) } catch (e) {}
        }
        state.monthlyBudget = action.payload.monthlyBudget || 0
        state.dailyBudget = action.payload.dailyBudget || 0
        state.dailyAlertTime = action.payload.dailyAlertTime || '20:00'
        state.todaySpent = action.payload.todaySpent || 0
        state.todayRemaining = action.payload.todayRemaining || 0
        state.todaySaved = action.payload.todaySaved || 0
        state.isOverspentToday = !!action.payload.isOverspentToday
        state.daysInMonth = action.payload.daysInMonth || 30
        state.categories = action.payload.categoryBudgets || []
        state.remaining = action.payload.monthlyBudget || 0
      })
      .addCase(fetchBudget.rejected, (state) => {
        state.loading = false
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('xpenz_cached_budget')
            if (cached) {
              const p = JSON.parse(cached)
              state.monthlyBudget = p.monthlyBudget || 0
              state.dailyBudget = p.dailyBudget || 0
              state.categories = p.categoryBudgets || []
              state.remaining = p.monthlyBudget || 0
            }
          } catch (e) {}
        }
        state.error = ''
      })
      .addCase(saveBudget.fulfilled, (state, action) => {
        state.monthlyBudget = action.payload.monthlyBudget || 0
        state.dailyBudget = action.payload.dailyBudget || 0
        state.dailyAlertTime = action.payload.dailyAlertTime || state.dailyAlertTime || '20:00'
        state.categories = action.payload.categoryBudgets || []
        state.remaining = action.payload.monthlyBudget || 0
      })
  }
})

export const { setBudget, setLoading, updateRemaining } = budgetSlice.actions
export default budgetSlice.reducer