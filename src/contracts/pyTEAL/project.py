from pyteal import *

""" Project Program """

def approval_program():

	### GLOBAL VARIABLES ###

	organizer_key = Bytes("organizer")
	goal_amount_key = Bytes("goal")
	creation_time_key = Bytes("creation")
	destruction_time_key = Bytes("destruction")
	destruction_time_enabled_key = Bytes("dest_allowed")
	closes_after_funds_met_key = Bytes("funds_met")
	project_open_key = Bytes("open")

		
	@Subroutine(TealType.none)
	def close_project(test_expression: Expr) -> Expr:
		return If(test_expression).Then( 
			Seq(
				InnerTxnBuilder.Begin(),
				InnerTxnBuilder.SetFields({
					TxnField.type_enum: TxnType.Payment,
					TxnField.close_remainder_to: App.globalGet(organizer_key)
				}),
				InnerTxnBuilder.Submit(),
				Approve() 
			)
		).Else( Reject() )

	

	### PROJECT CREATION ###
	
	# goal of the project
	goal_amount = Btoi(Txn.application_args[1])

	# creation time of the project
	creation_time = Btoi(Txn.application_args[2])

	# destruction time of the project
	destruction_time = Btoi(Txn.application_args[3])

	# does the project continue after funding goal reached?
	closes_after_funds_met = Btoi(Txn.application_args[4])
	
	# creation logic
	creation = Seq(

		# save creation arguments to global variables
		App.globalPut(organizer_key, Txn.sender()),
		App.globalPut(goal_amount_key, goal_amount),
		App.globalPut(creation_time_key, creation_time),
		App.globalPut(destruction_time_key, destruction_time),
		App.globalPut(destruction_time_enabled_key, 
			If(destruction_time < Global.latest_timestamp())
				.Then(Int(0))
				.Else(Int(1))
		),
		App.globalPut(closes_after_funds_met_key, closes_after_funds_met),
		App.globalPut(project_open_key, Int(1)),

		Approve()
	)



	### PROJECT CONTRACT INTERACTIONS ###

	"""
	# setup logic
	fxn_setup = Seq(
		If(Txn.sender() == App.globalGet(organizer_key))
			.Then(Approve()),
		Reject()
	)
	"""

	# receiving donations logic!
	dtx_i = Txn.group_index() - Int(1)
	fxn_donate = Seq(
		# check if this donation will be accepted
		Assert(
			And(
				App.globalGet(project_open_key) == Int(1),									# project is open?
				#Not(App.globalGet(organizer_key) == Txn.sender()),							# the creator can't donate to their own project?
				If(App.globalGet(destruction_time_enabled_key))								# does project have ending time?
					.Then(Global.latest_timestamp() <= App.globalGet(destruction_time_key))		# if so, has it passed?
					.Else(Int(1)),
				Gtxn[dtx_i].type_enum() == TxnType.Payment,									# is this a payment?
				Gtxn[dtx_i].sender() == Txn.sender(),										# is the sender the sender?
				Gtxn[dtx_i].receiver() == Global.current_application_address(),				# is it going to the contract account?
				Gtxn[dtx_i].amount() > Global.min_txn_fee()									# is it over the fee amount?
			)
		),
		
		If(App.globalGet(closes_after_funds_met_key))										# does the project close once funds are met?
			.Then(
				If((Balance(Global.current_application_address()) + Gtxn[dtx_i].amount()) >= App.globalGet(goal_amount_key))	# does this donation get the project funded?
					.Then(
						Seq(
							App.globalPut(project_open_key, Int(0)),						# close the project
							Approve()														# approve the txns
						)
					)
				.Else(
					Approve()																# txn does not exceed goal, approve
				))
			.Else(																			# if the project keeps going after goal met, approve the txn regardless
				Approve()
			),
		Reject()
	)

	

	fxn = Txn.application_args[0]
	fxns = Cond(
		[fxn == Bytes("donation"), fxn_donate],
	)


	

	## project teardown ##
	
	destruction = Seq(
		If(Txn.sender() == App.globalGet(organizer_key))
			.Then(
				close_project(Int(1) == Int(1))
			)
			.Else(
				Seq(
					If(App.globalGet(closes_after_funds_met_key) == Int(1))	# closes after funds met?
						.Then(
							close_project((App.globalGet(goal_amount_key) >= Balance(Global.current_application_address()))) # have funds been met?	
						),

					If(App.globalGet(destruction_time_enabled_key) == Int(1))	# closes after time passed?
						.Then(
							close_project((App.globalGet(destruction_time_key) <= Global.latest_timestamp()))	# has that time passed?
						),
					Reject()
				)
			),
		Reject()
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
		), Reject()],
	)


	return program

print(compileTeal(approval_program(), Mode.Application, version=5))