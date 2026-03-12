'use client'

import React, { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Trash2 } from 'lucide-react'

export default function TestDeletePage() {
  const [testResult, setTestResult] = useState<string>('')

  // Simulate delete function
  const mockDeleteHabit = async (id: string) => {
    console.log('Simulate deletion habits,ID:', id)
    // simulationAPIcall delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { error: null }
  }

  // Test delete functionality
  const testDeleteFunction = async () => {
    console.log('Start testing delete functionality...')
    setTestResult('Testing begins...')
    
    try {
      // Create a custom confirmation dialog
      const confirmDelete = () => {
        return new Promise<boolean>((resolve) => {
          const modal = document.createElement('div')
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Confirm deletion</h3>
              <p class="text-gray-600 mb-6">Confirm to delete"Testing habits"? This will also delete all related records and cannot be undone.</p>
              <div class="flex justify-end space-x-3">
                <button id="cancel-btn" class="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button id="confirm-btn" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  delete
                </button>
              </div>
            </div>
          `
          
          document.body.appendChild(modal)
          
          const cancelBtn = modal.querySelector('#cancel-btn')
          const confirmBtn = modal.querySelector('#confirm-btn')
          
          const cleanup = () => {
            document.body.removeChild(modal)
          }
          
          cancelBtn?.addEventListener('click', () => {
            cleanup()
            resolve(false)
          })
          
          confirmBtn?.addEventListener('click', () => {
            cleanup()
            resolve(true)
          })
          
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              cleanup()
              resolve(false)
            }
          })
        })
      }
      
      console.log('Show confirmation dialog...')
      setTestResult('Show confirmation dialog...')
      
      const confirmResult = await confirmDelete()
      console.log('User confirmation result:', confirmResult)
      
      if (confirmResult) {
        setTestResult('The user confirms deletion by callingAPI...')
        console.log('Start calling deleteAPI...')
        
        const result = await mockDeleteHabit('test-habit-id')
        console.log('APIReturn results:', result)
        
        if (result.error) {
          setTestResult(`Delete failed: ${result.error}`)
        } else {
          setTestResult('Deletion successful!')
          console.log('Delete successfully')
        }
      } else {
        setTestResult('User cancels deletion')
        console.log('User cancels deletion')
      }
    } catch (error) {
      console.error('An error occurred during testing:', error)
      setTestResult(`Test failed: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Delete functional test page</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test delete functionality</h2>
            <p className="text-gray-600 mb-4">
              This page is used to test whether the custom confirmation dialog and delete functionality are working properly.
            </p>
            
            <Button
              onClick={testDeleteFunction}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>Test delete functionality</span>
            </Button>
            
            {testResult && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Test results:</h3>
                <p className="text-blue-800">{testResult}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Debugging instructions</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Open the console of the browser developer tools to view detailed logs</p>
              <p>• Click"Test delete functionality"Button displays custom confirmation dialog</p>
              <p>• It will be simulated after confirming the deletion.APICalling process</p>
              <p>• All steps will output detailed logs on the console</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}