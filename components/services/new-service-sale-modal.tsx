"use client"

import { useAppSelector } from "@/store/hooks"
import { selectDeviceId } from "@/store/slices/deviceSlice"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import type React from "react"
import { useState } from "react"

interface NewServiceSaleModalProps {
  open: boolean
  onClose: () => void
  onSave: (serviceName: string) => void
}

const NewServiceSaleModal: React.FC<NewServiceSaleModalProps> = ({ open, onClose, onSave }) => {
  const [serviceName, setServiceName] = useState("")

  // Get deviceId from Redux store
  const deviceId = useAppSelector(selectDeviceId)

  const handleSave = () => {
    onSave(serviceName)
    setServiceName("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Service Sale</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Service Name"
          type="text"
          fullWidth
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

export default NewServiceSaleModal
