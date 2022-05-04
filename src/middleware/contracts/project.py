from pyteal import *

""" Project Program """

def approval_program(creator):

	### GLOBAL VARIABLES ###

	organizer_key = Bytes("organizer")
	goal_amount_key = Bytes("goal")
	creation_time_key = Bytes("creation")
	destruction_time_key = Bytes("destruction")
	destruction_time_enabled_key = Bytes("dest_allowed")
	allows_refunds_key = Bytes("refunds")
	closes_after_funds_met_key = Bytes("funds_met")


	### SUBROUTINES ###

	@Subroutine(TealType.none)
	def refund(address: Expr, amount: Expr) -> Expr:
		balance = Balance(Global.current_application_address)
		# TODO do some checking!!!

		return Seq(
			InnerTxnBuilder.Begin(),
			InnerTxnBuilder.SetFields({
				TxnType.type_enum: TxnType.Payment,
				TxnField.receiver: address,
				TxnField.amount: amount
			}),
			InnerTxnBuilder.Submit()
		)
		

	
	### PROJECT CONTRACT ROUTING ###

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


	### PROJECT CREATION ###
	
	# goal of the project
	goal_amount = Txn.application_args[1]

	# creation time of the project
	creation_time = Btoi(Txn.application_args[2)

	# destruction time of the project
	destruction_time = Btoi(Txn.application_args[3])

	# does the project allow refunds if things don't go well?
	allows_refunds = Txn.application_args[4]

	# does the project continue after funding goal reached?
	closes_after_funds_met = Txn.application_args[5]
	
	# creation logic
	creation = Seq(

		# save creation arguments to global variables
		App.globalPut(organizer_key, Txn.application_args[0]),
		App.globalPut(goal_amount_key, goal_amount),
		App.globalPut(creation_time_key, creation_time),
		App.globalPut(destruction_time_key, destruction_time),
		App.globalPut(destruction_time_enabled_key, 
			If(destruction_time < Global.latest_timestamp())
				.Then(Int(0))
				.Else(Int(1))
		),
		App.globalPut(closes_after_funds_met_key, closes_after_funds_met),

		# check if logic is sound
		Assert(
			And(
				Global.latest_timestamp() <= creation_time,
				If(destruction_time_enabled_key)
					.Then(creation_time < destruction_time)
					.Else(Int(1))
			)
		),

		# creation success
		Approve()
	)


	### PROJECT CONTRACT INTERACTIONS ###
	
	fxn = Txn.application_args[0]
	fxns = Cond(
		[fxn == Bytes("setup"), fxn_setup],
		[fxn == Bytes("donation"), fxn_donate],
		[fxn == Bytes("refund"), fxn_refund],
	)


	# setup logic
	fxn_setup = Seq(
		Assert(Global.latest_timestamp() < App.globalGet(creation_time_key)),
		Approve()
	)


	# receiving donations logic!
	dtx_i = Txn.group_index() - Int(1)
	fxn_donate = Seq(
		# check if this donation will be accepted
		Assert(
			And(
				App.globalGet(creation_time_key) <= Global.latest_timestamp(),				# project has begun?
				If(App.globalGet(destruction_time_enabled_key)								# does project have ending time?
					.Then(Global.latest_timestamp() < App.globalGet(destruction_time_key))		# if so, has it passed?
					.Else(Int(1))),
				Gtxn[dtx_i].type_enum() == TxnType.Payment,									# is this a payment?
				Gtxn[dtx_i].sender() == Txn.sender(),										# is the sender the sender?
				Gtxn[dtx_i].receiver() == Global.current_application_address(),				# is it going to the contract account?
				Gtxn[dtx_i].amount() > Global.min_txn_fee()									# is it over the fee amount?
			)
		), If(App.globalGet(closes_after_funds_met_key))
			.Then(
				If((Balance(Global.current_application_address) + Gtxn[dtx_i].amount()) >= App.globalGet(goal_amount_key))
					.Then()
					.Else()
			.Else(
				Approve()
			)
		)
	)

	# refunds, if applicable
	fxn_refund = Seq(
		Assert(
			And(
				App.globalGet(allows_refunds_key),											# does the project allow refunds?
				Or( 																		# is the organizer or project itself refunding?
					Txn.sender() == App.globalGet(organizer_key),
					Txn.sender() == App.current_application_address,
				)
			)
		),
		refund(Txn.application_args[0], Txn.application_args[1])							# refund, given address and amount
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