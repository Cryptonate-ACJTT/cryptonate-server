from pyteal import *

def clear_state_program():
	return Approve()

print(compileTeal(clear_state_program(), Mode.Application, version=5))