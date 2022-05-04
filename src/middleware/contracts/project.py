from pyteal import *

""" Project Program """

def approval_program(creator):

	goal_amount_key = Bytes("goal")
	creation_time_key = Bytes("creation")
	destruction_time_key = Bytes("destruction")

	# refund logic for contract which do so
	@Subroutine(TealType.none)
	def refund(address: Expr, amount: Expr) -> Expr:
		balance = Balance(Global.current_application_address)

		return Seq(
			InnerTxnBuilder.Begin(),
			InnerTxnBuilder.SetFields({
				TxnType.type_enum: TxnType.Payment,
				TxnField.receiver: address,
				TxnField.amount: amount
			})
		)
		

	### contract routing ###
	program = Cond(
		[Txn.application_id() == Int(0), creation],
		[Txn.on_completion() == OnComplete.NoOp, fxns],
		[Txn.on_completion() == OnComplete.DeleteApplication, destruction],
		[Or(
			Txn.on_completion() == OnComplete.OptIn,
			Txn.on_completion() == OnComplete.CloseOut,
			Txn.on_completion() == OnComplete.UpdateApplication
		), Reject()]
	)

	### project creation ###
	
	# goal of the project
	goal_amount = Txn.application_args[1]

	# creation time of the project
	creation_time = Btoi(Txn.application_args[2)

	# destruction time of the project
	destruction_time = Btoi(Txn.application_args[3])

	# does the project allow refunds if things don't go well?
	allows_refunds = Txn.application_args[4]
	

	# creation logic
	creation = Seq(
		App.globalPut(organizer_key, Txn.application_args[0]),
		App.globalPut(creation_time_key, creation_time),
		App.globalPut(destruction_time_key, destruction_time),
		App.globalPut(goal_amount_key, goal_amount)
		Assert(
			And(
				Global.latest_timestamp() < creation_time,
				creation_time < destruction_time
			)
		),
		Approve(),
	)

	### project interaction ###
	fxn = Txn.application_args[0]
	fxns = Cond(
		[fxn == Bytes("setup"), fxn_setup],
		[fxn == Bytes("donation"), fxn_donate]
	)


	# setup logic
	fxn_setup = Seq(
		Assert(Global.latest_timestamp() < App.globalGet(creation_time_key)),
		Approve()
	)


	# receiving donations logic!
	dtx_i = Txn.group_index() - Int(1)
	fxn_donate = Seq(
		Assert(
			And(
				App.globalGet(creation_time_key) <= Global.latest_timestamp()
				Global.latest_timestamp() < App.globalGet(destruction_time_key),
				Gtxn[dtx_i].type_enum() == TxnType.Payment,
				Gtxn[dtx_i].sender() == Txn.sender(),
				Gtxn[dtx_i].receiver() == Global.current_application_address(),
				Gtxn[dtx_i].amount() >= Global.min_txn_fee()
			),
		)
	)

	## project teardown ##

	destruction = Seq(
		# If the goal amount has been met.
		If(App.globalGet(goal_amount_key) >= Balance(Global.current_application_address).Then(

		),

		# If too much time has passed.
		If(App.globalGet(destruction_time_key) <= Global.latest_timestamp()).Then(
			Seq(

			)
		)
	)



def clear_state_program():
	pass