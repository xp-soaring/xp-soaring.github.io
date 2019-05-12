<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class ManagedDataRequest
    Inherits System.Windows.Forms.Form

    'Form overrides dispose to clean up the component list.
    <System.Diagnostics.DebuggerNonUserCode()> _
    Protected Overrides Sub Dispose(ByVal disposing As Boolean)
        If disposing AndAlso components IsNot Nothing Then
            components.Dispose()
        End If
        MyBase.Dispose(disposing)
    End Sub

    'Required by the Windows Form Designer
    Private components As System.ComponentModel.IContainer

    'NOTE: The following procedure is required by the Windows Form Designer
    'It can be modified using the Windows Form Designer.  
    'Do not modify it using the code editor.
    <System.Diagnostics.DebuggerStepThrough()> _
    Private Sub InitializeComponent()
        Me.ButtonConnect = New System.Windows.Forms.Button
        Me.ButtonDisconnect = New System.Windows.Forms.Button
        Me.ButtonRequest = New System.Windows.Forms.Button
        Me.RichResponses = New System.Windows.Forms.RichTextBox
        Me.Label1 = New System.Windows.Forms.Label
        Me.SuspendLayout()
        '
        'ButtonConnect
        '
        Me.ButtonConnect.Location = New System.Drawing.Point(23, 29)
        Me.ButtonConnect.Name = "ButtonConnect"
        Me.ButtonConnect.Size = New System.Drawing.Size(129, 29)
        Me.ButtonConnect.TabIndex = 0
        Me.ButtonConnect.Text = "Connect to FSX"
        Me.ButtonConnect.UseVisualStyleBackColor = True
        '
        'ButtonDisconnect
        '
        Me.ButtonDisconnect.Location = New System.Drawing.Point(23, 186)
        Me.ButtonDisconnect.Name = "ButtonDisconnect"
        Me.ButtonDisconnect.Size = New System.Drawing.Size(129, 29)
        Me.ButtonDisconnect.TabIndex = 1
        Me.ButtonDisconnect.Text = "Disconnect from FSX"
        Me.ButtonDisconnect.UseVisualStyleBackColor = True
        '
        'ButtonRequest
        '
        Me.ButtonRequest.Location = New System.Drawing.Point(23, 93)
        Me.ButtonRequest.Name = "ButtonRequest"
        Me.ButtonRequest.Size = New System.Drawing.Size(129, 49)
        Me.ButtonRequest.TabIndex = 2
        Me.ButtonRequest.Text = "Request Data on User Aircraft"
        Me.ButtonRequest.UseVisualStyleBackColor = True
        '
        'RichResponses
        '
        Me.RichResponses.BackColor = System.Drawing.Color.SandyBrown
        Me.RichResponses.Font = New System.Drawing.Font("Courier New", 9.75!, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, CType(0, Byte))
        Me.RichResponses.Location = New System.Drawing.Point(172, 29)
        Me.RichResponses.Name = "RichResponses"
        Me.RichResponses.ReadOnly = True
        Me.RichResponses.Size = New System.Drawing.Size(433, 186)
        Me.RichResponses.TabIndex = 3
        Me.RichResponses.Text = ""
        '
        'Label1
        '
        Me.Label1.AutoSize = True
        Me.Label1.Location = New System.Drawing.Point(178, 11)
        Me.Label1.Name = "Label1"
        Me.Label1.Size = New System.Drawing.Size(60, 13)
        Me.Label1.TabIndex = 4
        Me.Label1.Text = "Responses"
        '
        'Form1
        '
        Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0!, 13.0!)
        Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
        Me.ClientSize = New System.Drawing.Size(642, 246)
        Me.Controls.Add(Me.Label1)
        Me.Controls.Add(Me.RichResponses)
        Me.Controls.Add(Me.ButtonRequest)
        Me.Controls.Add(Me.ButtonDisconnect)
        Me.Controls.Add(Me.ButtonConnect)
        Me.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow
        Me.Name = "Form1"
        Me.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen
        Me.Text = "  VB.NET Managed Data Request"
        Me.ResumeLayout(False)
        Me.PerformLayout()

    End Sub
    Friend WithEvents ButtonConnect As System.Windows.Forms.Button
    Friend WithEvents ButtonDisconnect As System.Windows.Forms.Button
    Friend WithEvents ButtonRequest As System.Windows.Forms.Button
    Friend WithEvents RichResponses As System.Windows.Forms.RichTextBox
    Friend WithEvents Label1 As System.Windows.Forms.Label

End Class
